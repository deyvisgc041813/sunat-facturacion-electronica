import { EstadoEnumComprobante } from "src/util/estado.enum";

export interface IUpdateComprobante {
  estado?: EstadoEnumComprobante;
  xmlFirmado?: string;
  hashCpe?: string;
  cdr?: Buffer
  motivoEstado?:string
}
