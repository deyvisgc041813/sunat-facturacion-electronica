import { EstadoEnumComprobante } from "src/util/estado.enum";

export interface IResponseSunat {
  mensaje: string;
  estadoSunat: EstadoEnumComprobante,
  codigoResponse?: string,
  status: boolean;
  xmlFirmado?: any;
  observaciones: string[],
  comprobanteId?:number,
  cdr?: Buffer | null | undefined
}
