import { CreateErrorLogDto } from 'src/domain/error-log/dto/CreateErrorLogDto';
import { CreateSunatLogDto } from 'src/domain/sunat-log/interface/sunat.log.interface';
import { EstadoEnumComprobante } from 'src/util/estado.enum';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
import { QueryFailedError } from 'typeorm';

export class ErrorMapper {
  static mapError(
    error: any,
    data: {
      empresaId: number;
      tipo: string;
      serie: string;
      correlativo: number;
    },
  ) {
    // Caso 2: Error lanzado como JSON.stringify({ code, message })
    let origen: OrigenErrorEnum;
    let codigoError: string;
    let mensajeError: string;
    let detalleError: any;
    // Caso 1: Fault XML parseado
    const fault = error?.root?.Envelope?.Body?.Fault;
    // Caso 2: Error lanzado como JSON.stringify({ code, message })
    const sunatJson = this.parseJsonIfPossible(error.message);
    if (fault || sunatJson?.code) {
      // 🔹 Error SUNAT
      origen = OrigenErrorEnum.SUNAT;
      codigoError = fault?.faultcode || sunatJson?.code || 'ERR_SUNAT';
      mensajeError = fault?.faultstring || sunatJson?.message || 'Error SUNAT';
      detalleError = fault || sunatJson;
      const create: CreateSunatLogDto = {
        comprobanteId: 0,
        estado: this.mapSunatFaultToEstado(mensajeError),
        response: JSON.stringify(detalleError),
      };
      return {
        tipoError: origen,
        create,
      };
    } else {
      if (error instanceof QueryFailedError) {
        // 🔹 Error de BD
        origen = OrigenErrorEnum.DB;
        codigoError = (error as any).code;
        mensajeError = error.message;
        detalleError = error;
      } else if (
        error.code &&
        ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'].includes(
          error.code,
        )
      ) {
        // 🔹 Error de red
        origen = OrigenErrorEnum.NETWORK;
        codigoError = error.code;
        mensajeError = 'Error de red al comunicarse con servicio externo';
        detalleError = error;
      } else {
        // 🔹 Error interno del sistema
        origen = OrigenErrorEnum.SYSTEM;
        codigoError = error.code || 'ERR_SYSTEM';
        mensajeError = error.message || 'Error interno inesperado';
        detalleError = error;
      }
      const create = new CreateErrorLogDto();
      ((create.empresaId = data.empresaId ?? 0),
        (create.tipoComprobante = data.tipo));
      create.serie = data.serie;
      create.correlativo = String(data.correlativo);
      create.origen = origen;
      create.codigoError = codigoError;
      create.mensajeError = mensajeError;
      create.detalleError = JSON.stringify(detalleError);
      create.estado = EstadoEnumComprobante.ERROR
      return {
        tipoError: origen,
        create,
      };
    }
  }
  private static mapSunatFaultToEstado(code: string): EstadoEnumComprobante {
    const numericCode = parseInt(code.split('.').pop() || '', 10);

    if (!isNaN(numericCode)) {
      if (numericCode >= 1000 && numericCode < 2000) {
        return EstadoEnumComprobante.ERROR;
      }
      if (numericCode >= 2000 && numericCode < 4000) {
        return EstadoEnumComprobante.RECHAZADO;
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
}
