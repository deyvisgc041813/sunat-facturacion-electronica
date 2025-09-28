import { TipoComprobanteEnum, TipoDocumentoIdentidadEnum } from "src/util/catalogo.enum";


export interface ICreateComprobante {
  sucursalId: number;
  // Datos de cabecera del comprobante
  tipoComprobante:
    | TipoComprobanteEnum.FACTURA
    | TipoComprobanteEnum.BOLETA
    | TipoComprobanteEnum.NOTA_CREDITO
    | TipoComprobanteEnum.NOTA_DEBITO
    | TipoComprobanteEnum.RESUMEN_DIARIO
    | TipoComprobanteEnum.COMUNICACION_BAJA;
  serie: string; // F001, B001, etc.
  numeroDocumento: string;
  tipoDocumento:
    | TipoDocumentoIdentidadEnum.DOC_TRIB_NO_DOM_SIN_RUC
    | TipoDocumentoIdentidadEnum.DNI
    | TipoDocumentoIdentidadEnum.CARNET_EXTRANJERIA
    | TipoDocumentoIdentidadEnum.RUC
    | TipoDocumentoIdentidadEnum.PASAPORTE
    | TipoDocumentoIdentidadEnum.CEDULA_DIPLOMATICA;
  fechaEmision: string;
  moneda: string; // PEN, USD
  // Totales
  totalGravado?: number;
  totalExonerado?: number;
  totalInafecto?: number;
  totalIgv: number;
  mtoImpVenta: number;
  mtoIcbper?: number,
  // Respaldo del JSON original
  payloadJson: any;
}
