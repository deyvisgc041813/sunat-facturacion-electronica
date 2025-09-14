import { EstadoEnumComprobante } from "src/util/estado.enum";

export class CreateErrorLogDto {
  empresaId: number;
  tipoComprobante:string;
  serie: string;
  correlativo: string;
  origen: string;
  codigoError:string
  mensajeError:string
  detalleError:string
  estado:EstadoEnumComprobante

  constructor(partial?: Partial<CreateErrorLogDto>) {
    Object.assign(this, partial);
  }
}
