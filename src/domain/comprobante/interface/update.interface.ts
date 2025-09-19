import { EstadoEnumComprobante } from "src/util/estado.enum";

export interface IUpdateComprobante {
  estado?: EstadoEnumComprobante;
  xmlFirmado?: string;
  hashCpe?: string | null
  cdr?: string | null
  descripcionEstado?:string
  fechaUpdate?:any
}
