export class ProductoResponseDto {
 
  constructor(
    public producto_id: number,
    public codigo: string,
    public descripcion: string,
    public unidadMedida: string,
    public precioUnitario: number,
    public afecta_igv: number,
    public estado: string,
    public sucursalId?: number 
  ) {}

}
