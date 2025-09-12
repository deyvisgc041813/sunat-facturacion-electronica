export class CreateErrorLogDto {
  empresaId: number;
  tipoComprobante:string;
  serie: string;
  correlativo: string;
  origen: string;
  codigoError:string
  mensajeError:string
  detalleError:string

  constructor(partial?: Partial<CreateErrorLogDto>) {
    Object.assign(this, partial);
  }
}
