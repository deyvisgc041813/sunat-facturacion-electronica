import { ProductoResponseDto } from "src/domain/productos/dto/ProductoResponseDto";
import { ProductoRepository } from "src/domain/productos/Producto.repository";

export class FindByIdProductoUseCase {
  constructor(private readonly productoRepo: ProductoRepository) {}

  async execute(id: number): Promise<ProductoResponseDto | null> {
    return this.productoRepo.findById(id);
  }
}
