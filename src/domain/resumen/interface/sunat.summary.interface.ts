export interface ISummaryDocument {
  ublVersion: string; // fijo "2.0"
  customizationID: string; // fijo "1.1"
  resumenId: string; // generado por la API: RC-YYYYMMDD-N
  fechaEnvio: Date; // fecha envio del resumen
  fecReferencia: Date; //fecha de los comprobantes que se están resumiendo.
  company: Company;
  documentos: IDocumento[];
  signatureId:string
  signatureNote:string
}


export interface Company {
  ruc: string;
  tipoDoc: string;
  razonSocial: string;
}

export interface IDocumento {
  linea: number;
  tipoDoc: string; // 03 (boleta)
  serieNumero: string;
  tipoMoneda: string; // PEN
  cliente: {
    tipoDoc: string;
    numDoc: string;
  };
  estado: string; // 1 vigente, 3 anulado
  total: number;
  igv: number;
  pagos: Pago[];
  mtoOperGravadas: number;
  mtoOperExoneradas: number;
  mtoOperInafectas: number;
  mtoOperExportacion?: number;
  comprobanteId: number;
  icbper?: number;
}

export interface Pago {
  monto: number;
  tipo: string;
}
