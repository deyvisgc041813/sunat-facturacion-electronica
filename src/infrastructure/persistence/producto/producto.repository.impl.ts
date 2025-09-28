import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductoRepository } from 'src/domain/productos/Producto.repository';
import { CreateProductoDto } from 'src/domain/productos/dto/CreateProductoDto';
import { ProductoResponseDto } from 'src/domain/productos/dto/ProductoResponseDto';
import { UpdateProductoDto } from 'src/domain/productos/dto/UpdateProductoDto';
import { ProductoMapper } from 'src/domain/mapper/ProductoMapper';
import { ProductoOrmEntity } from './ProductoOrmEntity';
import { SucursalMapper } from 'src/domain/mapper/SucursalMapper';

@Injectable()
export class ProductoRepositoryImpl implements ProductoRepository {
  constructor(
    @InjectRepository(ProductoOrmEntity) private readonly repo: Repository<ProductoOrmEntity>,
  ) {}
  async save( producto: CreateProductoDto): Promise<{ status: boolean; message: string; data?: ProductoResponseDto }> {
    const newProducto = await this.repo.save(ProductoMapper.dtoToOrmCreate(producto));
    return {
      status: true,
      message: 'Cliente registrado correctamente',
      data: ProductoMapper.ormToDTO(newProducto),
    };
  }

  async findAll(): Promise<ProductoResponseDto[]> {
    const result = await this.repo.find({
      relations: ['empresa'],
    });
    return result.map((p) => {
      const sucursal = SucursalMapper.toDomain(p.sucursal)
      return new ProductoResponseDto(
        p.productoId,
        p.codigo,
        p.descripcion,
        p.unidadMedida ?? '',
        p.precioUnitario,
        p.afectaIgv ?? 0,
        p.estado,
        sucursal,
      );
    });
  }

  async findById(id: number): Promise<ProductoResponseDto | null> {
    const producto = await this.repo.findOne({
      where: { productoId: id },
      relations: ['empresa'],
    });
    if (!producto) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    const sucursal = SucursalMapper.toDomain(producto.sucursal)
    return new ProductoResponseDto(
        producto.productoId,
        producto.codigo,
        producto.descripcion,
        producto.unidadMedida ?? '',
        producto.precioUnitario,
        producto.afectaIgv ?? 0,
        producto.estado,
        sucursal,
    );
  }
  async update(producto: UpdateProductoDto, productId:number): Promise<{ status: boolean; message: string; data?: ProductoResponseDto }> {
    const productoUpdate = ProductoMapper.dtoToOrmUpdate(producto);
    productoUpdate.productoId = productId
    const clientUpdate = await this.repo.save(productoUpdate);
    return {
      status: true,
      message: 'Actualizado correctamente',
      data:  ProductoMapper.ormToDTO(clientUpdate)
    };
  }
}
