import { CreateErrorLogDto } from 'src/domain/error-log/dto/CreateErrorLogDto';
import { CreateSunatLogDto } from 'src/domain/sunat-log/interface/sunat.log.interface';
import { EstadoEnumComprobante } from 'src/util/estado.enum';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
import { QueryFailedError } from 'typeorm';
import { buildDuplicateMessage } from '../exceptions/http-error.filter';

export class ErrorMapper {
  static mapError(
    error: any,
    data: {
      sucursalId: number;
      tipo: string;
      serie: string;
      correlativo?: number;
    },
  ) {
    let origen: OrigenErrorEnum = OrigenErrorEnum.SYSTEM;
    let codigoError = 'ERR_SYSTEM';
    let mensajeError = 'Error interno inesperado';
    let detalleError: any = error;

    // 1. Caso: HttpException con response (ej. SUNAT)
    if (error?.response?.origen === OrigenErrorEnum.SUNAT) {
      origen = OrigenErrorEnum.SUNAT;
      codigoError = error.response.code || 'ERR_SUNAT';
      mensajeError = error.response.message || 'Error SUNAT';
      detalleError = error.response;

      const create: CreateSunatLogDto = {
        comprobanteId: 0,
        estado: this.mapSunatFaultToEstado(mensajeError),
        response: JSON.stringify(detalleError),
        codigoResSunat: codigoError,
      };

      return { tipoError: origen, create };
    }

    // 2. Caso: Fault XML (cuando aún no lo envuelves en HttpException)
    const fault = error?.root?.Envelope?.Body?.Fault;
    const sunatJson = this.parseJsonIfPossible(error.message);
    if (fault || sunatJson?.code) {
      origen = OrigenErrorEnum.SUNAT;
      codigoError = fault?.faultcode || sunatJson?.code || 'ERR_SUNAT';
      mensajeError = fault?.faultstring || sunatJson?.message || 'Error SUNAT';
      detalleError = fault || sunatJson;

      const create: CreateSunatLogDto = {
        comprobanteId: 0,
        estado: this.mapSunatFaultToEstado(mensajeError),
        response: JSON.stringify(detalleError),
        codigoResSunat: codigoError,
      };

      return { tipoError: origen, create };
    }

    // 3. Caso: error BD
    if (error instanceof QueryFailedError) {
      origen = OrigenErrorEnum.DB;
      codigoError = (error as any).code;
      mensajeError = this.mapDbMessage(error);
      detalleError = error;
    }

    // 4. Caso: error de red
    else if (
      error.code &&
      ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'].includes(
        error.code,
      )
    ) {
      origen = OrigenErrorEnum.NETWORK;
      codigoError = error.code;
      mensajeError = 'Error de red al comunicarse con servicio externo';
      detalleError = error;
    }

    // 5. Caso: error genérico
    else {
      origen = OrigenErrorEnum.SYSTEM;
      codigoError = error.code || 'ERR_SYSTEM';
      mensajeError = error.message || 'Error interno inesperado';
      detalleError = error;
    }

    // 📌 Creación del log genérico
    const create = new CreateErrorLogDto();
    create.sucursalId = data.sucursalId ?? 0;
    create.tipoComprobante = data.tipo;
    create.serie = data.serie;
    create.correlativo = String(data.correlativo);
    create.origen = origen;
    create.codigoError = codigoError;
    create.mensajeError = mensajeError;
    create.detalleError = JSON.stringify(detalleError);
    create.estado = EstadoEnumComprobante.ERROR;

    return { tipoError: origen, create };
  }

  private static mapSunatFaultToEstado(code: string): EstadoEnumComprobante {
    const numericCode = parseInt(code.split('.').pop() || '', 10);

    if (!isNaN(numericCode)) {
      if (numericCode >= 100 && numericCode <= 1075) {
        return EstadoEnumComprobante.ERROR;
      }
      if (numericCode >= 2010 && numericCode <= 2752) {
        return EstadoEnumComprobante.RECHAZADO; // PENDIENTE_RECTIFICACION cuando es rechazado es pendiente de reactificacion
      }
      if (numericCode >= 2753 && numericCode <= 4282) {
        return EstadoEnumComprobante.OBSERVADO;
      }
    }
    return EstadoEnumComprobante.ERROR;
  }

  // Helper para parsear JSON seguro
  private static parseJsonIfPossible(value: any) {
    try {
      return typeof value === 'string' ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }
  private static mapDbMessage(error: QueryFailedError): string {
    const sqlError: any = error;
    switch (sqlError.code) {
      case 'ER_DUP_ENTRY':
        return buildDuplicateMessage(sqlError);
      case 'ER_NO_REFERENCED_ROW_2':
        return 'Violación de clave foránea';
      default:
        return sqlError.message;
    }
  }
}
