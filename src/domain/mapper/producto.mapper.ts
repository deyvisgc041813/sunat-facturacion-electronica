
import { ProductoOrmEntity } from "src/infrastructure/persistence/tenant/entity/inventario/producto.orm.entity";
import { ProductoResponseDto } from "../tenant/inventario/producto/dto/producto.response.dto";
import { CreateProductoDto } from "../tenant/inventario/producto/dto/create.product.dto";
import { UpdateProductoDto } from "../tenant/inventario/producto/dto/update.product.dto";

export class ProductoMapper {
  static toDomain(orm: ProductoOrmEntity): ProductoResponseDto {
    return new ProductoResponseDto(
      orm.productoId,
      orm.codigo,
      orm.descripcion,
      orm.unidadMedida,
      orm.precioUnitario,
      orm.afectaIgv ?? 0,
      orm.estado,
      orm.sucursalId
    );
  }
 private static assignCommon(object: ProductoOrmEntity, orm: any, isUpdate = false): ProductoOrmEntity {
     object.sucursalId = orm.sucursalId ?? 0
     object.codigo = orm.codigo 
     object.descripcion = orm.descripcion 
     object.unidadMedida = orm.unidadMedida
     object.precioUnitario = orm.precioUnitario
     object.afectaIgv = orm.afecta_igv
     return object
  }

  static dtoToOrmCreate(dto: CreateProductoDto): ProductoOrmEntity {
    return this.assignCommon(new ProductoOrmEntity(), dto, false);
  }

  static dtoToOrmUpdate(dto: UpdateProductoDto): ProductoOrmEntity {
    return this.assignCommon(new ProductoOrmEntity(), dto, true);
  }

}

