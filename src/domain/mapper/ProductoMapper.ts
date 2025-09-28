import { ProductoResponseDto } from "src/domain/productos/dto/ProductoResponseDto";
import { CreateProductoDto } from "src/domain/productos/dto/CreateProductoDto";
import { UpdateProductoDto } from "src/domain/productos/dto/UpdateProductoDto";
import { ProductoOrmEntity } from "src/infrastructure/persistence/producto/ProductoOrmEntity";
import { SucursalMapper } from "./SucursalMapper";

export class ProductoMapper {
  static ormToDTO(orm: ProductoOrmEntity): ProductoResponseDto {
    const sucursal = orm.sucursal ? SucursalMapper.toDomain(orm.sucursal) : undefined
    return new ProductoResponseDto(
      orm.productoId,
      orm.codigo,
      orm.descripcion,
      orm.unidadMedida,
      orm.precioUnitario,
      orm.afectaIgv ?? 0,
      orm.estado,
      sucursal
    );
  }
 private static assignCommon(object: ProductoOrmEntity, orm: any, isUpdate = false): ProductoOrmEntity {
     object.sucursal.sucursalId = orm.sucursalId ?? 0
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

