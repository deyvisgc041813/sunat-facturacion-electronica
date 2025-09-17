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
// Catálogo 03: Unidad de Medida
export enum ChargeIndicatorEnum {
  DESCUENTO = 'false',
  RECARGO = 'true'
}
// Catálogo 03: Unidad de Medida
export enum ProcesoNotaCreditoEnum {
  GENERADA_DESDE_DATOS_SIMPLES = 'generadaDesdeDatosSimples',
  VALIDADA_DESDE_COMPROBANTE_CALCULADO = 'validadaDesdeComprobanteCalculado'
}

// Catálogo 09: Códigos de tipo de nota de crédito electrónica
export enum NotaCreditoMotivo {
  ANULACION_OPERACION = '01',                // Anulación de la operación
  ANULACION_ERROR_RUC = '02',                // Anulación por error en el RUC
  CORRECCION_DESCRIPCION = '03',             // Corrección por error en la descripción
  DESCUENTO_GLOBAL = '04',                   // Descuento global
  DESCUENTO_POR_ITEM = '05',                 // Descuento por ítem
  DEVOLUCION_TOTAL = '06',                   // Devolución total
  DEVOLUCION_POR_ITEM = '07',                // Devolución por ítem
  BONIFICACION = '08',                       // Bonificación
  DISMINUCION_VALOR = '09'                   // Disminución en el valor
}

// Catálogo 09: Códigos de tipo de nota de crédito electrónica
export enum NotaDebitoMotivo {
  INTERECES_MORA = '01',  // Cuando se cobra un interés adicional por pago tardío.
  AUMENTO_VALOR = '02',   // Cuando se incrementa el importe del comprobante (ejemplo: se olvidó facturar un servicio o se corrige un precio).
  PENALIDADES = '03',     // Cuando se cobra un monto por incumplimiento (ejemplo: devolver un equipo dañado o entregar fuera de plazo).
}

export enum CodigoProductoNotaDebito {
  AJUSTE_GLOBAL_OPERACION = 'AU001', // Ajuste por aumento global de la operación
  INTERES_POR_MORA = 'INT001',       // Ajuste por intereses de mora
}
// nota-debito.enum.ts
export enum TipoAumentoNotaDebito {
  GLOBAL = 'GLOBAL',
  ITEM = 'ITEM',
  INVALIDO = 'INVALIDO',
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
export enum Catalogo53DescuentoGlobal {
  DESCUENTO_AFECTA_IGV = "00",
}
export enum LegendCodeEnum {
  MONTO_EN_LETRAS = '1000', // Monto en Letras : Todas las facturas, boletas, notas de crédito y débito deben llevar esta leyenda.
  TRANSFERENCIA_GRATUITA = '1002', // Transferencia gratuita de un bien/servicio
  COMPROBANTE_PERCEPCION = '2000', // Comprobante de percepción
  AMAZONIA_BIENES = '2001', // Bienes transferidos en la Amazonía - región selva
  AMAZONIA_SERVICIOS = '2002', // Servicios prestados en la Amazonía - región selva
  AMAZONIA_CONSTRUCCION = '2003', // Contratos de construcción en la Amazonía
  AGENCIA_VIAJE = '2004', // Agencia de viaje - Paquete turístico
  EMISOR_ITINERANTE = '2005', // Venta realizada por emisor itinerante
  DETRACCION = '2006', // Operación sujeta a detracción
  IVAP = '2007', // Operación sujeta al IVAP
  TACNA_VENTA_EXONERADA = '2008', // Venta exonerada en zona comercial Tacna
  TACNA_PRIMERA_VENTA = '2009', // Primera venta de mercancía identificable en zona comercial
  RESTITUCION_DERECHOS = '2010', // Restitución Simplificado de Derechos Arancelarios
  EXPORTACION_SERVICIOS = '2011', // Exportación de servicios - Decreto Legislativo 919
}

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
  21: { id: "1000", name: "IGV", taxTypeCode: "VAT" },   // Transferencia gratuita

  // Inafectas
  30: { id: "9998", name: "INA", taxTypeCode: "FRE" },   // Operación Onerosa
  31: { id: "9998", name: "INA", taxTypeCode: "FRE" },   // Retiro por bonificación
  32: { id: "9998", name: "INA", taxTypeCode: "FRE" },   // Retiro
  33: { id: "9998", name: "INA", taxTypeCode: "FRE" },   // Muestras Médicas
  34: { id: "9998", name: "INA", taxTypeCode: "FRE" },   // Convenio Colectivo
  35: { id: "9998", name: "INA", taxTypeCode: "FRE" },   // Retiro por premio
  36: { id: "9998", name: "INA", taxTypeCode: "FRE" },   // Retiro por publicidad
  37: { id: "1000", name: "IGV", taxTypeCode: "FRE" },   // Transferencia gratuita

  // Exportación
  40: { id: "9995", name: "EXP", taxTypeCode: "FRE" },   // Exportación de Bienes o Servicios
};

// Catálogo de tributos SUNAT
export const MAP_TRIBUTOS: Record<string, { id: string; name: string; taxTypeCode: string }> = {
  IGV: { id: '1000', name: 'IGV', taxTypeCode: 'VAT' },
  ICBPER: { id: '7152', name: 'ICBPER', taxTypeCode: 'OTH' },
  EXO: { id: '9997', name: 'EXO', taxTypeCode: 'VAT' },
  INA: { id: '9998', name: 'INA', taxTypeCode: 'FRE' }
};


