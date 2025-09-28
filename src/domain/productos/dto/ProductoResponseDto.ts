import { SucursalResponseDto } from "src/domain/sucursal/dto/SucursalResponseDto";

export class ProductoResponseDto {
 
  constructor(
    public producto_id: number,
    public codigo: string,
    public descripcion: string,
    public unidadMedida: string,
    public precioUnitario: number,
    public afecta_igv: number,
    public estado: number,
    public sucursal?: SucursalResponseDto | null 
  ) {}

}
