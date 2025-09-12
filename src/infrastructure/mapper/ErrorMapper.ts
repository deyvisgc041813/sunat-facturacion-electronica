import { CreateErrorLogDto } from 'src/domain/error-log/dto/CreateErrorLogDto';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
import { QueryFailedError } from 'typeorm';

export class ErrorMapper {
  static mapError(
    error: any,
    data: {
      empresaId: number;
      tipo: string;
      serie: string;
      correlativo: string;
    },
  ) {
    const fault = error?.root?.Envelope?.Body?.Fault;

    let origen: OrigenErrorEnum;
    let codigoError: string;
    let mensajeError: string;
    let detalleError: any;

    if (fault) {
      // 🔹 Error SUNAT
      origen = OrigenErrorEnum.SUNAT;
      codigoError = fault?.faultcode || 'ERR_SUNAT';
      mensajeError = fault?.faultstring || error.message;
      detalleError = fault;
    } else if (error instanceof QueryFailedError) {
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
    create.correlativo = data.correlativo;
    create.origen = origen;
    create.codigoError = codigoError;
    create.mensajeError = mensajeError;
    create.detalleError = JSON.stringify(detalleError);
    return create;
  }
}
