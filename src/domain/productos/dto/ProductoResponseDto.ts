import { EmpresaResponseDto } from "../../empresa/dto/EmpresaResponseDto";

export class ProductoResponseDto {
 
  constructor(
    public producto_id: number,
    public empresaId: number,
    public codigo: string,
    public descripcion: string,
    public unidadMedida: string,
    public precioUnitario: number,
    public afecta_igv: number,
    public estado: number,
    public empresa?: EmpresaResponseDto | null 
  ) {}

}
