// Estados de COMPROBANTES
export enum EstadoEnumComprobante {
  PENDIENTE = 'PENDIENTE',
  ENVIADO = 'ENVIADO',
  ACEPTADO = 'ACEPTADO',
  RECHAZADO = 'RECHAZADO',
  OBSERVADO = 'OBSERVADO',
  POR_RECTIFICAR = 'POR_RECTIFICAR',
  ANULADO = 'ANULADO',
  CONTINGENCIA = 'CONTINGENCIA',
  MODIFICADO = 'MODIFICADO',
  ERROR = 'ERROR',
  NO_EXISTE = 'NO EXISTE'
}
export enum EstadoComprobanteEnumSunat {
  PENDIENTE = '1',
  ANULADO = '3',
}

export enum EstadoEnvioSunat {
  PENDIENTE = 'PENDIENTE',         // Registrado pero aún no enviado
  ENVIADO = 'ENVIADO',             // Enviado a SUNAT, en espera
  PROCESANDO = 'PROCESANDO',       // SUNAT lo tiene en cola (98)
  ACEPTADO = 'ACEPTADO',           // SUNAT lo aprobó (0)
  RECHAZADO = 'RECHAZADO',         // SUNAT lo rechazó (127)
  OBSERVADO = 'OBSERVADO',         // SUNAT con observaciones
  RECTIFICAR = 'POR_RECTIFICAR',       // Necesita corrección
  CONTINGENCIA = 'CONTINGENCIA',   // Enviado por contingencia
  ANULADO = 'ANULADO',             // Anulado manualmente
  ERROR = 'ERROR',                 // Error interno o de comunicación
}

export const codigoRespuestaSunatMap : Record<string, EstadoEnvioSunat> = {
  '0': EstadoEnvioSunat.ACEPTADO,
  '98': EstadoEnvioSunat.PROCESANDO,
  '127': EstadoEnvioSunat.RECHAZADO,
  '0127': EstadoEnvioSunat.RECHAZADO,
};

export enum EstadoComunicacionEnvioSunat {
  NO_ENVIADO = "0",
  ENVIADO = "1",
  ACEPTADO_PROCESADO = "2"
}

export enum EstadoCpeSunat {
  ACEPTADO = "0",          // Comprobante aceptado
  RECHAZADO = "1",         // Comprobante rechazado
  OBSERVADO = "2",         // Comprobante aceptado con observaciones
  ANULADO = "3",           // Comprobante dado de baja
  NO_ENCONTRADO = "4",     // Comprobante no encontrado en SUNAT
  ERROR = "9",             // Error en consulta o estado inconsistente
}

export enum EstadoSystem {
  ACTIVO= 1,
  INACTIVO = 0
}