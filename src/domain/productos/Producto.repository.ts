import { CreateProductoDto } from "./dto/CreateProductoDto";
import { ProductoResponseDto } from "./dto/ProductoResponseDto";
import { UpdateProductoDto } from "./dto/UpdateProductoDto";

export interface ProductoRepository {
  save(producto: CreateProductoDto): Promise<{status: boolean, message: string, data?: ProductoResponseDto}>;
  findAll(): Promise<ProductoResponseDto[]>;
  findById(id: number): Promise<ProductoResponseDto | null>;
  update(producto: UpdateProductoDto, productId:number): Promise<{status: boolean, message: string, data?: ProductoResponseDto}> 
}
