import {
  Injectable,
} from '@nestjs/common';
import { In } from 'typeorm';
import { ProductoMapper } from 'src/domain/mapper/producto.mapper';
import { ProductoOrmEntity } from '../../entity/inventario/producto.orm.entity';
import { ProductoRepository } from 'src/domain/tenant/inventario/producto/port/producto.repository.port';
import { CreateProductoDto } from 'src/domain/tenant/inventario/producto/dto/create.product.dto';
import { ProductoResponseDto } from 'src/domain/tenant/inventario/producto/dto/producto.response.dto';
import { UpdateProductoDto } from 'src/domain/tenant/inventario/producto/dto/update.product.dto';
import { EEstadosGlobales } from 'src/util/estado.enum';
import { TenantRepositoryHelper } from 'src/domain/parent/conecciones-database/service/tenant-repository.helper';
import { BaseTenantRepository } from 'src/infrastructure/persistence/base/base-tenant.repository';
import { TenantContextService } from 'src/domain/parent/conecciones-database/service/tenant-context.service';
import { BusinessLogicException } from 'src/adapter/web/exception/exeception-dynamic';

@Injectable()
export class ProductoRepositoryImpl  extends BaseTenantRepository<ProductoOrmEntity>  implements ProductoRepository {
  constructor(
    tenantRepositoryHelper: TenantRepositoryHelper,
    tenantContext: TenantContextService
  ) {
    super(tenantContext, tenantRepositoryHelper, ProductoOrmEntity);
  }
  async save(
    producto: CreateProductoDto,
  ): Promise<{ status: boolean; message: string; data?: ProductoResponseDto }> {
    const repo = await this.getRepository();
    const newProducto = await repo.save( ProductoMapper.dtoToOrmCreate(producto));
    return {
      status: true,
      message: 'El producto se registro correctamente',
      data: ProductoMapper.toDomain(newProducto),
    };
  }

  async findAll(sucursalId: number): Promise<ProductoResponseDto[]> {
    const repo = await this.getRepository();
    const result = await repo.find({
      where: {
        sucursalId,
        estado: In([EEstadosGlobales.ACTIVO, EEstadosGlobales.INACTIVO]),
      },
    });
    return result.map((p) => ProductoMapper.toDomain(p));
  }

  async findById(
    sucursalId: number,
    productoId: number,
  ): Promise<ProductoResponseDto | null> {
    const repo = await this.getRepository();
    const producto = await repo.findOne({
      where: { sucursalId, productoId, estado: In([EEstadosGlobales.ACTIVO]) },
    });
    if (!producto) {
      throw new BusinessLogicException(
        `Producto con id ${productoId} no encontrado`,
      );
    }
    return ProductoMapper.toDomain(producto);
  }
  async update(
    producto: UpdateProductoDto,
    productId: number,
  ): Promise<{ status: boolean; message: string; data?: ProductoResponseDto }> {
    const repo = await this.getRepository();
    const productoUpdate = ProductoMapper.dtoToOrmUpdate(producto);
    productoUpdate.productoId = productId;
    const clientUpdate = await repo.save(productoUpdate);
    return {
      status: true,
      message: 'El producto se actualizó correctamente.',
      data: ProductoMapper.toDomain(clientUpdate),
    };
  }
}
