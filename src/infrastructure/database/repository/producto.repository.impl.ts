import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpresaMapper } from 'src/infrastructure/mapper/EmpresaMapper';
import { ProductoRepository } from 'src/domain/productos/Producto.repository';
import { ProductoOrmEntity } from '../entity/ProductoOrmEntity';
import { CreateProductoDto } from 'src/domain/productos/dto/CreateProductoDto';
import { ProductoResponseDto } from 'src/domain/productos/dto/ProductoResponseDto';
import { ProductoMapper } from 'src/infrastructure/mapper/ProductoMapper';
import { UpdateProductoDto } from 'src/domain/productos/dto/UpdateProductoDto';

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
      const empresaResponseDto = EmpresaMapper.toDomain(p.empresa)
      return new ProductoResponseDto(
        p.productoId,
        p.empresaId,
        p.codigo,
        p.descripcion,
        p.unidadMedida ?? '',
        p.precioUnitario,
        p.afectaIgv ?? 0,
        p.estado,
        empresaResponseDto,
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
    const empresa = EmpresaMapper.toDomain(producto.empresa)
    return new ProductoResponseDto(
        producto.productoId,
        producto.empresaId,
        producto.codigo,
        producto.descripcion,
        producto.unidadMedida ?? '',
        producto.precioUnitario,
        producto.afectaIgv ?? 0,
        producto.estado,
        empresa,
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
