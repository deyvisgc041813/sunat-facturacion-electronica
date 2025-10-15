import { CreateProductoDto } from "../dto/create.product.dto";
import { ProductoResponseDto } from "../dto/producto.response.dto";
import { UpdateProductoDto } from "../dto/update.product.dto";

export interface ProductoRepository {
  save(producto: CreateProductoDto): Promise<{status: boolean, message: string, data?: ProductoResponseDto}>;
  findAll(sucursalId:number): Promise<ProductoResponseDto[]>;
  findById(sucursalId:number, productoId: number): Promise<ProductoResponseDto | null>;
  update(producto: UpdateProductoDto, productId:number): Promise<{status: boolean, message: string, data?: ProductoResponseDto}> 
}
