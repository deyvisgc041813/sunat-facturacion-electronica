import { BadRequestException } from '@nestjs/common';
import { ConprobanteRepository } from 'src/domain/comprobante/comprobante.repository';
import { IResponseSunat } from 'src/domain/comprobante/interface/response.sunat.interface';
import { BajaComprobanteResponseDto } from 'src/domain/comunicacion-baja/ComunicacionBajaResponseDto';
import { IComunicacionBajaRepository } from 'src/domain/comunicacion-baja/interface/baja.repository.interface';
import { EmpresaInternaResponseDto } from 'src/domain/empresa/dto/EmpresaInternaResponseDto';
import { ErrorMapper } from 'src/domain/mapper/ErrorMapper';
import { ISucursalRepository } from 'src/domain/sucursal/sucursal.repository';
import { CreateSunatLogDto } from 'src/domain/sunat-log/interface/sunat.log.interface';
import { SunatLogRepository } from 'src/domain/sunat-log/SunatLog.repository';
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
  EstadoEnvioSunat.OBSERVADO,
]);
export class GetStatusBajaStatusUseCase {
  constructor(
    private readonly sunatService: SunatService,
    private readonly bajaRepo: IComunicacionBajaRepository,
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
    const baja = await this.bajaRepo.findBySucursalAndTicket(
      sucursalId,
      ticket,
    );

    try {
      if (!baja) {
        throw new BadRequestException(
          `No existe una solicitud de comunicacion baja registrado con el ticket ${ticket}. Verifique que el número de ticket proporcionado sea correcto.`,
        );
      }
      await this.validarEstadoFinalBaja(baja);
      const usuarioSecundario = empresa?.usuarioSolSecundario ?? '';
      const claveSecundaria = CryptoUtil.decrypt(
        empresa.claveSolSecundario ?? '',
      );
      const result = await this.sunatService.getStatus(
        ticket,
        usuarioSecundario,
        claveSecundaria,
      );

      // 2. Actualizar estado en la BD según respuesta

      await this.bajaRepo.updateBySucursalAndTicket(sucursalId, ticket, {
        estado: mapSunatToEstado(result.codigoResponse ?? ''),
        codResPuestaSunat: result.codigoResponse,
        cdr: result.cdr,
        mensajeSunat: result.mensaje,
        fechaRespuestaSunat: new Date(),
        observacionSunat:
          result.observaciones.length > 0
            ? JSON.stringify(result.observaciones)
            : null,
      });
      // 3. Actualizar comprobantes
      const comprobantesIds: number[] = (baja?.detalles ?? [])
        .map((d) => d.comprobante?.comprobanteId)
        .filter((id): id is number => id !== undefined);

      await this.comprobanteRepo.updateComprobanteStatusMultiple(
        sucursalId,
        comprobantesIds,
        EstadoEnumComprobante.ANULADO,
        EstadoComunicacionEnvioSunat.ACEPTADO_PROCESADO,
      );
      // 4. Retornar resultado
      return result;
    } catch (error: any) {
      // 9. Actualizar resumen con error
      if (baja) {
        if (!estadosFinales.has(baja.estado as EstadoEnvioSunat)) {
          await this.bajaRepo.update(baja?.serie, sucursalId, {
            estado: EstadoEnvioSunat.ERROR,
          });
        }
        await this.procesarErrorBaja(
          error,
          0,
          sucursalId ?? 0,
          baja?.serie,
          baja.xml ?? '',
        );
      }
      throw error;
    }
  }
  private async procesarErrorBaja(
    error: any,
    bajaId: number,
    sucursalId: number,
    serie: string,
    xmlFirmado: string,
  ) {
    const rspError = ErrorMapper.mapError(error, {
      sucursalId,
      tipo: 'RA', // BAJA
      serie,
    });

    if (rspError.tipoError === OrigenErrorEnum.SUNAT) {
      const obj = rspError.create as CreateSunatLogDto;
      obj.codigoResSunat = JSON.parse(obj.response ?? '')?.code;
      //obj.bajaId = bajaId;
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
  private async validarEstadoFinalBaja(baja: BajaComprobanteResponseDto) {
    const estado = codigoRespuestaSunatMap[baja?.codigoRespuestaSunat ?? ''];
    if (estadosFinales.has(estado)) {
      throw new BadRequestException(
        `La solicitud de baja ya fue procesada por SUNAT y se encuentra en estado definitivo (${estado}). ` +
          `No es posible volver a enviarla ni consultarla nuevamente.`,
      );
    }
  }
}
