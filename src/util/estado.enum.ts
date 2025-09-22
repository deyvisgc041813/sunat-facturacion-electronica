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
}
export enum EstadoComprobanteEnumSunat {
  PENDIENTE = '1',
  ANULADO = '3',
}

// Estados de RESUMEN DE BOLETAS
export enum EstadoEnumResumen {
  PENDIENTE = 'PENDIENTE',
  ENVIADO = 'ENVIADO',
  EN_PROCESO = 'EN_PROCESO',
  ACEPTADO = 'ACEPTADO',
  RECHAZADO = 'RECHAZADO',
  POR_RECTIFICAR = 'POR_RECTIFICAR',
  CONTINGENCIA = 'CONTINGENCIA',
  ERROR = 'ERROR',
}

export const sunatEstadoMap: Record<string, EstadoEnumResumen> = {
  '0': EstadoEnumResumen.ACEPTADO,
  '98': EstadoEnumResumen.EN_PROCESO,
  '127': EstadoEnumResumen.RECHAZADO,
  '0127': EstadoEnumResumen.RECHAZADO,
};
export enum EstadoComunicacionEnvioSunat {
  NO_ENVIADO = "0",
  ENVIADO = "1",
}
