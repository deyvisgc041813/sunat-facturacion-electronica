import { SucursalResponseDto } from "src/domain/sucursal/dto/sucursal.response.dto";

export class SerieResponseDto {
 
  constructor(
    public serieId: number,
    public tipoComprobante: string,
    public serie: string,
    public correlativoInicial: number,
    public correlativoActual: number,
    public usuarioRegistro:string,
    public fechaRegistro:Date,
    public usuarioModificacion?:string,
    public fechaModificacion?:Date,
    public sucursal?: SucursalResponseDto
  ) {}

}
