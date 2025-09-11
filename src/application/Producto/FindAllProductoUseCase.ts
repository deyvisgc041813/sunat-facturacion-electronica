import { ProductoResponseDto } from "src/domain/productos/dto/ProductoResponseDto";
import { ProductoRepository } from "src/domain/productos/Producto.repository";


export class FindAllProductoUseCase {
  constructor(private readonly productoRepo: ProductoRepository) {}

  async execute(): Promise<ProductoResponseDto[]> {
    return this.productoRepo.findAll();
  }
}
