import { ProductoResponseDto } from "src/domain/tenant/inventario/producto/dto/producto.response.dto";
import { ProductoRepository } from "src/domain/tenant/inventario/producto/port/producto.repository.port";

export class FindByIdProductoUseCase {
  constructor(private readonly productoRepo: ProductoRepository) {}

  async execute(sucursalId: number, productoId:number): Promise<ProductoResponseDto | null> {
    return this.productoRepo.findById(sucursalId, productoId);
  }
}
