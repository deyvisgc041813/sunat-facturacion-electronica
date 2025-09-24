import { BadRequestException } from '@nestjs/common';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { ConprobanteRepository } from 'src/domain/comprobante/comprobante.repository';
import { IResponseSunat } from 'src/domain/comprobante/interface/response.sunat.interface';
import { BajaComprobanteResponseDto } from 'src/domain/comunicacion-baja/ComunicacionBajaResponseDto';
import { IComunicacionBajaRepository } from 'src/domain/comunicacion-baja/interface/baja.repository.interface';
import { ErrorMapper } from 'src/domain/mapper/ErrorMapper';
import { CreateSunatLogDto } from 'src/domain/sunat-log/interface/sunat.log.interface';
import { SunatLogRepository } from 'src/domain/sunat-log/SunatLog.repository';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
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
  ) {}

  async execute(
    empresaId: number,
    ticket: string,
  ): Promise<IResponseSunat> {
    const baja = await this.bajaRepo.findByEmpresaAndTicket(empresaId, ticket);
    try {
      if (!baja) {
        throw new BadRequestException(
          `No existe una solicitud de comunicacion baja registrado con el ticket ${ticket}. Verifique que el número de ticket proporcionado sea correcto.`,
        );
      }
      await this.validarEstadoFinalBaja(baja);
      const result = await this.sunatService.getStatus(ticket);

      // 2. Actualizar estado en la BD según respuesta

      await this.bajaRepo.updateByEmpresaAndTicket(empresaId, ticket, {
        estado: mapSunatToEstado(result.codigoResponse ?? ''),
        codResPuestaSunat: result.codigoResponse,
        cdr: result.cdr,
        mensajeSunat: result.mensaje,
        fechaRespuestaSunat: new Date(),
        observacionSunat: result.observaciones.length > 0 ? JSON.stringify(result.observaciones) : null
      });
      // 3. Actualizar comprobantes
      const comprobantesIds: number[] = (baja?.detalles ?? [])
        .map((d) => d.comprobante?.comprobanteId)
        .filter((id): id is number => id !== undefined);

      await this.comprobanteRepo.updateComprobanteStatusMultiple(
        empresaId,
        comprobantesIds,
        EstadoEnumComprobante.ANULADO,
        EstadoComunicacionEnvioSunat.ACEPTADO_PROCESADO,
      );
      // 4. Retornar resultado
      return result
    } catch (error: any) {
      // 9. Actualizar resumen con error
      if (baja) {
        if (!estadosFinales.has(baja.estado as EstadoEnvioSunat)) {
          await this.bajaRepo.update(baja?.serie, empresaId, {
            estado: EstadoEnvioSunat.ERROR,
          });
        }
        await this.procesarErrorResumen(
          error,
          0,
          empresaId ?? 0,
          baja?.serie,
          baja.xml ?? '',
        );
      }
      throw error;
    }
  }
  private async procesarErrorResumen(
    error: any,
    resumendIdBd: number,
    empresaId: number,
    serie: string,
    xmlFirmado: string,
  ) {
    const rspError = ErrorMapper.mapError(error, {
      empresaId,
      tipo: 'RA', // Resumen
      serie,
    });

    if (rspError.tipoError === OrigenErrorEnum.SUNAT) {
      const obj = rspError.create as CreateSunatLogDto;
      obj.codigoResSunat = JSON.parse(obj.response ?? '')?.code;
      obj.resumenId = resumendIdBd;
      obj.empresaId = empresaId;
      obj.serie = serie;
      obj.request = xmlFirmado;
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
