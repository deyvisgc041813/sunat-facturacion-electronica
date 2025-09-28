import { SucursalResponseDto } from "src/domain/sucursal/dto/SucursalResponseDto";

export class SerieResponseDto {
 
  constructor(
    public serieId: number,
    public tipoComprobante: string,
    public serie: string,
    public correlativoInicial: number,
    public correlativoActual: number,
    public sucursal?: SucursalResponseDto
  ) {}

}
