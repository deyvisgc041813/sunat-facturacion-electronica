export enum TipoCatalogoEnum {
  TIPO_COMPROBANTE = '01',
  MONEDA = '02',
  UNIDAD_MEDIDA = '03',
  TIPO_TRIBUTOS = '05',
  DOCUMENTO_IDENTIDAD = '06',
  TIPO_AFECTACION = '07',
  MOTIVO_NOTA_CREDITO = '09',
  MOTIVO_NOTA_DEBITO = '10',
  TIPO_OPERACION = '17',
  TIPO_OPERACION_GUIA_REMISION = '51',
  LEYENDAS = '52',
}
export enum TipoComprobanteEnum {
  FACTURA = '01',
  BOLETA = '03',
  NOTA_CREDITO = '07',
  NOTA_DEBITO = '08',
  RESUMEN_DIARIO = '20', // uso interno
  COMUNICACION_BAJA = '21', // uso interno
}
export enum CodigoSunatTasasEnum {
  IGV = '1000', // IGV Impuesto General a las Ventas
  IMPUESTO_ARROZ_PILADO = '1016', // Impuesto a la Venta Arroz Pilado
  ISC = '2000', // ISC Impuesto Selectivo al Consumo
  IMP_BOLSA_PLASTICA = '7152', // Impuesto a la bolsa plástica
  EXPORTACION = '9995', // Exportación
  GRATUITO = '9996', // Gratuito
  EXONERADO = '9997', // Exonerado
  INAFECTO = '9998', // Inafecto
  OTROS_TRIBUTOS = '9999', // Otros tributos
  TASA_ANUAL_MORA = 'TIM', // Tasa anual Mora 2025
}
export enum OperacionResumenEnum {
  ADICIONAR = 'ADICIONAR', // Alta de boleta
  MODIFICAR = 'MODIFICACION', // Modificación de boleta ya informada
  BAJA = 'BAJA', // Baja (anulación) de boleta
}
// Catálogo 06: Tipo de Documento de Identidad
export enum TipoDocumentoIdentidadEnum {
  DOC_TRIB_NO_DOM_SIN_RUC = '0', // cuando se paga sin dni y sin ruc. 699
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
  RECARGO = 'true',
}
// Catálogo 03: Unidad de Medida
export enum ProcesoNotaCreditoEnum {
  GENERADA_DESDE_DATOS_SIMPLES = 'generadaDesdeDatosSimples',
  VALIDADA_DESDE_COMPROBANTE_CALCULADO = 'validadaDesdeComprobanteCalculado',
}
// Catálogo 09: Códigos de tipo de nota de crédito electrónica
export enum NotaCreditoMotivo {
  ANULACION_OPERACION = '01', // Anulación de la operación
  ANULACION_ERROR_RUC = '02', // Anulación por error en el RUC
  CORRECCION_DESCRIPCION = '03', // Corrección por error en la descripción
  DESCUENTO_GLOBAL = '04', // Descuento global
  DESCUENTO_POR_ITEM = '05', // Descuento por ítem
  DEVOLUCION_TOTAL = '06', // Devolución total
  DEVOLUCION_POR_ITEM = '07', // Devolución por ítem
  BONIFICACION = '08', // Bonificación
  DISMINUCION_VALOR = '09', // Disminución en el valor
}

// Catálogo 09: Códigos de tipo de nota de crédito electrónica
export enum NotaDebitoMotivo {
  INTERECES_MORA = '01', // Cuando se cobra un interés adicional por pago tardío.
  AUMENTO_VALOR = '02', // Cuando se incrementa el importe del comprobante (ejemplo: se olvidó facturar un servicio o se corrige un precio).
  PENALIDADES = '03', // Cuando se cobra un monto por incumplimiento (ejemplo: devolver un equipo dañado o entregar fuera de plazo).
}

export enum CodigoProductoNotaDebito {
  AJUSTE_GLOBAL_OPERACION = 'AU001', // Ajuste por aumento global de la operación
  INTERES_POR_MORA = 'INT001', // Ajuste por intereses de mora
  PENALIDAD_CONTRATO = 'PEN001', // Ajuste por penalidad
}
// nota-debito.enum.ts
export enum TipoAumentoNotaDebito {
  GLOBAL = 'GLOBAL',
  ITEM = 'ITEM',
  INVALIDO = 'INVALIDO',
}
export enum TipoDocumentoLetras {
  FACTURA = 'Factura',
  BOLETA = 'Boleta',
  NOTA_DEBITO = 'Nota de Débito',
  NOTA_CREDITO = 'Nota de Crédito',
}



export enum Catalogo53DescuentoGlobal {
  DESCUENTO_AFECTA_IGV = '00',
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
// Enum de PriceTypeCode
export enum PriceTypeCode {
  CON_IGV = '01',    // Valor unitario con IGV (operación gravada, exonerada, inafecta)
  GRATUITA = '02',   // Valor referencial para operaciones gratuitas
}
