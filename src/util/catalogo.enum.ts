export enum TipoCatalogoEnum {
  TIPO_COMPROBANTE = '01',
  MONEDA = '02',
  UNIDAD_MEDIDA = '03',
  DOCUMENTO_IDENTIDAD = '06',
  TIPO_NOTA_CREDITO = '07',
  TIPO_NOTA_DEBITO = '08',
}

export enum TipoComprobanteEnum {
  FACTURA = '01',
  BOLETA = '03',
  NOTA_CREDITO = '07',
  NOTA_DEBITO = '08',
}

// Catálogo 06: Tipo de Documento de Identidad
export enum TipoDocumentoIdentidadEnum {
  DOC_TRIB_NO_DOM_SIN_RUC = '0',
  DNI = '1',
  CARNET_EXTRANJERIA = '4',
  RUC = '6',
  PASAPORTE = '7',
  CEDULA_DIPLOMATICA = 'A',
}

// Catálogo 02: Moneda
export enum MonedaEnum {
  PEN = 'PEN',
  USD = 'USD',
  EUR = 'EUR',
}

// Catálogo 03: Unidad de Medida
export enum UnidadMedidaEnum {
  UNIDAD = 'NIU',
  KILOGRAMO = 'KGM',
  LITRO = 'LTR',
  SERVICIO = 'ZZ',
}

// 🔹 Operaciones Gravadas (con IGV, precio normal)
export const TIPO_AFECTACION_GRAVADAS: number[] = [
  10, // Gravado - Onerosa
  11, // Gravado - Retiro por premio
  12, // Gravado - Retiro por donación
  13, // Gravado - Retiro
  14, // Gravado - Retiro por publicidad
  15, // Gravado - Bonificaciones
  16, // Gravado - Retiro por entrega a trabajadores
  17, // Gravado - IVAP
];

// 🔹 Operaciones Exoneradas
export const TIPO_AFECTACION_EXONERADAS: number[] = [
  20, // Exonerado - Onerosa,
  21, // Exonerado - Transferencia gratuita
];

// 🔹 Operaciones Inafectas
export const TIPO_AFECTACION_INAFECTAS: number[] = [
  30, // Inafecto - Onerosa
  31, // Inafecto – Retiro por Bonificación
  32, // Inafecto - Retiro
  33, // Inafecto – Retiro por Muestras Médicas
  34, // Inafecto - Inafecto - Retiro por Convenio Colectivo
  35, // Inafecto – Retiro por premio
  36, // Inafecto - Retiro por publicidad
  37, // Inafecto - Transferencia gratuita
  40, // Inafecto - Exportación de Bienes o Servicios
];

// 🔹 Operaciones de Exportación
export const TIPO_AFECTACION_EXPORTACION: number[] = [
  40, // Exportación
];

// 🔹 Operaciones Gratuitas
export const TIPO_AFECTACION_GRATUITAS: number[] = [
  21, // Exonerado - Transferencia gratuita
  31, // Inafecto - Transferencia gratuita
  // NOTA: también se consideran "gratuitas" algunas del bloque 11-16 cuando el precio es 0
];

// 📌 Catálogo de Tipos de Afectación del IGV → Tributos
export const MAP_TIPO_AFECTACION_TRIBUTO: Record<number, { id: string; name: string; taxTypeCode: string }> = {
  // Gravadas
  10: { id: "1000", name: "IGV", taxTypeCode: "VAT" },   // Operación Onerosa
  11: { id: "9996", name: "IGV", taxTypeCode: "VAT" },   // Retiro por premio
  12: { id: "9996", name: "IGV", taxTypeCode: "VAT" },   // Retiro por donación
  13: { id: "9996", name: "IGV", taxTypeCode: "VAT" },   // Retiro
  14: { id: "9996", name: "IGV", taxTypeCode: "VAT" },   // Retiro por publicidad
  15: { id: "9996", name: "IGV", taxTypeCode: "VAT" },   // Bonificaciones
  16: { id: "9996", name: "IGV", taxTypeCode: "VAT" },   // Retiro a trabajadores
  17: { id: "1016", name: "IVAP", taxTypeCode: "VAT" },  // IVAP

  // Exoneradas
  20: { id: "9997", name: "EXO", taxTypeCode: "VAT" },   // Operación Onerosa
  21: { id: "9997", name: "EXO", taxTypeCode: "VAT" },   // Transferencia gratuita

  // Inafectas
  30: { id: "9998", name: "INA", taxTypeCode: "FRE" },   // Operación Onerosa
  31: { id: "9998", name: "INA", taxTypeCode: "FRE" },   // Retiro por bonificación
  32: { id: "9998", name: "INA", taxTypeCode: "FRE" },   // Retiro
  33: { id: "9998", name: "INA", taxTypeCode: "FRE" },   // Muestras Médicas
  34: { id: "9998", name: "INA", taxTypeCode: "FRE" },   // Convenio Colectivo
  35: { id: "9998", name: "INA", taxTypeCode: "FRE" },   // Retiro por premio
  36: { id: "9998", name: "INA", taxTypeCode: "FRE" },   // Retiro por publicidad
  37: { id: "9998", name: "INA", taxTypeCode: "FRE" },   // Transferencia gratuita

  // Exportación
  40: { id: "9995", name: "EXP", taxTypeCode: "FRE" },   // Exportación de Bienes o Servicios
};

