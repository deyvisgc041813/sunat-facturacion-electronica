import { BadRequestException } from '@nestjs/common';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { ConprobanteRepository } from 'src/domain/comprobante/comprobante.repository';
import { ErrorMapper } from 'src/domain/mapper/ErrorMapper';
import { ResumenResponseDto } from 'src/domain/resumen/dto/ResumenResponseDto';
import { CreateSunatLogDto } from 'src/domain/sunat-log/interface/sunat.log.interface';
import { SunatLogRepository } from 'src/domain/sunat-log/SunatLog.repository';
import { ResumenRepositoryImpl } from 'src/infrastructure/persistence/resumen/resumen.repository';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import {
  EstadoEnumComprobante,
  EstadoEnumResumen,
  sunatEstadoMap,
} from 'src/util/estado.enum';
import { mapSunatToEstado } from 'src/util/Helpers';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
const estadosFinales = new Set([
  EstadoEnumResumen.ACEPTADO,
  EstadoEnumResumen.RECHAZADO,
  EstadoEnumResumen.ERROR,
]);
export class GetStatusResumenUseCase {
  constructor(
    private readonly sunatService: SunatService,
    private readonly resumenRepo: ResumenRepositoryImpl,
    private readonly sunatLogRepo: SunatLogRepository,
    private readonly comprobanteRepo: ConprobanteRepository,
  ) {}

  async execute(
    ticket: string,
  ): Promise<GenericResponse<{ statusCode: string; cdr: any }>> {
    const resumen = await this.resumenRepo.findByTicket(ticket);
    try {
      if (!resumen) {
        throw new BadRequestException(
          `No existe un resumen registrado con el ticket ${ticket}. Verifique que el número de ticket proporcionado sea correcto.`,
        );
      }
      await this.validarEstadoFinalResumen(resumen);
      const result = await this.sunatService.getStatus(ticket);

      // 2. Actualizar estado en la BD según respuesta

      await this.resumenRepo.updateByTicket(ticket, {
        estado: mapSunatToEstado(result.statusCode),
        codResuestSunat: result.statusCode,
        cdr: result.cdr?.toString('base64') ?? null,
        mensajeSunat: result.statusMessage,
        fechaRespuestaSunat: new Date(),
      });
      // 3. Actualizar boletas
      const boletasIds: number[] = (resumen?.detalles ?? [])
        .map((d) => d.comprobante?.comprobanteId)
        .filter((id): id is number => id !== undefined);

      await this.comprobanteRepo.actualizarEstadoBoletas(
        boletasIds,
        EstadoEnumComprobante.ACEPTADO,
        true,
      );
      // 4. Retornar resultado
      return {
        status: result.statusCode === '0',
        data: {
          statusCode: result.statusCode,
          cdr: result.cdr?.toString('base64') ?? null,
        },
        message: result.statusMessage,
      };
    } catch (error: any) {
      // 9. Actualizar resumen con error
      const resumenId = resumen?.resumenId ?? '';
      if (resumen) {
        if (!estadosFinales.has(resumen.estado as EstadoEnumResumen)) {
          await this.resumenRepo.update(resumenId, {
            estado: EstadoEnumResumen.ERROR,
          });
        }
        await this.procesarErrorResumen(
          error,
          resumen?.resBolId ?? 0,
          resumen?.empresa?.empresaId ?? 0,
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
    empresaId: number,
    resumenId: string,
    xmlFirmado: string,
  ) {
    const rspError = ErrorMapper.mapError(error, {
      empresaId,
      tipo: 'RC', // Resumen
      serie: resumenId,
    });

    if (rspError.tipoError === OrigenErrorEnum.SUNAT) {
      const obj = rspError.create as CreateSunatLogDto;
      obj.codigoResumenSunat = JSON.parse(obj.response ?? '')?.code;
      obj.resumenId = resumendIdBd;
      obj.request = xmlFirmado;
      await this.sunatLogRepo.save(obj);
    }
  }
  private async validarEstadoFinalResumen(resumen: ResumenResponseDto) {
    const estado = sunatEstadoMap[resumen?.codigoRespuestaSunat ?? ''];

    if (estadosFinales.has(estado)) {
      throw new BadRequestException(
        `El resumen ya fue procesado por SUNAT y se encuentra en estado definitivo (${estado}). ` +
          `No es posible volver a enviarlo ni consultarlo nuevamente.`,
      );
    }
  }
}
