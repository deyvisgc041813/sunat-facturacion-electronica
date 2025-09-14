import { EstadoEnumComprobante } from "src/util/estado.enum";

export interface EstadoCdrResult {
  estado: EstadoEnumComprobante;
  codigo: string;
  mensaje: string;
  observaciones?: string | string[] | null;
}
