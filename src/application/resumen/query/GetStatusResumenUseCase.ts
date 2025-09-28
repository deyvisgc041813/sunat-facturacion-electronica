import { BadRequestException } from '@nestjs/common';
import { ConprobanteRepository } from 'src/domain/comprobante/comprobante.repository';
import { IResponseSunat } from 'src/domain/comprobante/interface/response.sunat.interface';
import { EmpresaInternaResponseDto } from 'src/domain/empresa/dto/EmpresaInternaResponseDto';
import { ErrorMapper } from 'src/domain/mapper/ErrorMapper';
import { ResumenResponseDto } from 'src/domain/resumen/dto/ResumenResponseDto';
import { ISucursalRepository } from 'src/domain/sucursal/sucursal.repository';
import { CreateSunatLogDto } from 'src/domain/sunat-log/interface/sunat.log.interface';
import { SunatLogRepository } from 'src/domain/sunat-log/SunatLog.repository';
import { ResumenRepositoryImpl } from 'src/infrastructure/persistence/resumen/resumen.repository';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { CryptoUtil } from 'src/util/CryptoUtil';
import {
  codigoRespuestaSunatMap,
  EstadoComunicacionEnvioSunat,
  EstadoEnumComprobante,
  EstadoEnvioSunat,
} from 'src/util/estado.enum';
import { mapSunatToEstado } from 'src/util/Helpers';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
const estadosFinales = new Set([
  EstadoEnvioSunat.ACEPTADO,
  EstadoEnvioSunat.RECHAZADO,
  EstadoEnvioSunat.ERROR,
]);
export class GetStatusResumenUseCase {
  constructor(
    private readonly sunatService: SunatService,
    private readonly resumenRepo: ResumenRepositoryImpl,
    private readonly sunatLogRepo: SunatLogRepository,
    private readonly comprobanteRepo: ConprobanteRepository,
    private readonly sucurSalRepo: ISucursalRepository,
  ) {}

  async execute(
    empresaId: number,
    sucursalId: number,
    ticket: string,
  ): Promise<IResponseSunat> {
    const sucursal = await this.sucurSalRepo.findSucursalInterna(
      empresaId,
      sucursalId,
    );
    if (!sucursal) {
      throw new BadRequestException(
        `No se encontró ninguna sucursal asociada al identificador proporcionado (${sucursalId}). Verifique que el ID sea correcto.`,
      );
    }
    const empresa = sucursal.empresa as EmpresaInternaResponseDto;
    if (!empresa?.certificadoDigital || !empresa?.claveCertificado) {
      throw new Error(
        `No se encontró certificado digital para la sucursal con RUC ${empresa?.ruc}`,
      );
    }

    const resumen = await this.resumenRepo.findBySucursalAndTicket(
      sucursalId,
      ticket,
    );
    try {
      if (!resumen) {
        throw new BadRequestException(
          `No existe un resumen registrado con el ticket ${ticket}. Verifique que el número de ticket proporcionado sea correcto.`,
        );
      }
      const usuarioSecundario = empresa?.usuarioSolSecundario ?? '';
      const claveSecundaria = CryptoUtil.decrypt(empresa.claveSolSecundario ?? '');
      await this.validarEstadoFinalResumen(resumen);
      const result = await this.sunatService.getStatus(
        ticket,
        usuarioSecundario,
        claveSecundaria,
      );

      // 2. Actualizar estado en la BD según respuesta

      await this.resumenRepo.updateBySucursalAndTicket(sucursalId, ticket, {
        estado: mapSunatToEstado(result.codigoResponse ?? ''),
        codResPuestaSunat: result.codigoResponse ?? '',
        cdr: result.cdr?.toString('base64') ?? null,
        mensajeSunat: result.mensaje,
        observacionSunat:
          result.observaciones.length > 0
            ? JSON.stringify(result.observaciones)
            : null,
        fechaRespuestaSunat: new Date(),
      });

      // 3. Actualizar boletas
      const boletasIds: number[] = (resumen?.detalles ?? [])
        .map((d) => d.comprobante?.comprobanteId)
        .filter((id): id is number => id !== undefined);
      // esto se debe cambiar con el tocken
      await this.comprobanteRepo.updateBoletaStatus(
        sucursalId,
        boletasIds,
        EstadoEnumComprobante.ACEPTADO,
        EstadoComunicacionEnvioSunat.ACEPTADO_PROCESADO,
      );
      // 4. Retornar resultado
      return result;
    } catch (error: any) {
      // 9. Actualizar resumen con error
      const resumenId = resumen?.resumenId ?? '';
      if (resumen) {
        if (!estadosFinales.has(resumen.estado as EstadoEnvioSunat)) {
          await this.resumenRepo.update(resumenId, sucursalId, {
            estado: EstadoEnvioSunat.ERROR,
          });
        }
        await this.procesarErrorResumen(
          error,
          resumen?.resBolId ?? 0,
          resumen?.sucursal?.sucursalId ?? 0,
          resumenId,
          resumen.xml ?? '',
        );
      }
      throw error;
    }
  }
  private async procesarErrorResumen(
    error: any,
    resumendIdBd: number,
    sucursalId: number,
    serie: string,
    xmlFirmado: string,
  ) {
    const rspError = ErrorMapper.mapError(error, {
      sucursalId,
      tipo: 'RC', // Resumen
      serie,
    });

    if (rspError.tipoError === OrigenErrorEnum.SUNAT) {
      const obj = rspError.create as CreateSunatLogDto;
      obj.codigoResSunat = JSON.parse(obj.response ?? '')?.code;
      obj.resumenId = resumendIdBd;
      obj.serie = serie;
      obj.request = xmlFirmado;
      obj.sucursalId = sucursalId;
      ((obj.intentos = 0), // esto cambiar cuando este ok
        (obj.usuarioEnvio = 'DEYVISGC')); // esto cambiar cuando este ok
      obj.fechaRespuesta = new Date();
      obj.fechaEnvio = new Date()
      await this.sunatLogRepo.save(obj);
    }
  }
  private async validarEstadoFinalResumen(resumen: ResumenResponseDto) {
    const estado = codigoRespuestaSunatMap[resumen?.codigoRespuestaSunat ?? ''];

    if (estadosFinales.has(estado)) {
      throw new BadRequestException(
        `El resumen ya fue procesado por SUNAT y se encuentra en estado definitivo (${estado}). ` +
          `No es posible volver a enviarlo ni consultarlo nuevamente.`,
      );
    }
  }
}
