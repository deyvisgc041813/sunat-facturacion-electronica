import { ProductoResponseDto } from "src/domain/tenant/inventario/producto/dto/producto.response.dto";
import { ProductoRepository } from "src/domain/tenant/inventario/producto/port/producto.repository.port";

export class FindAllProductoUseCase {
  constructor(private readonly productoRepo: ProductoRepository) {}
  async execute(sucursalId:number): Promise<ProductoResponseDto[]> {
    return this.productoRepo.findAll(sucursalId);
  }
}
