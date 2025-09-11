import { EmpresaMapper } from "./EmpresaMapper";
import { ProductoOrmEntity } from "../database/entity/ProductoOrmEntity";
import { ProductoResponseDto } from "src/domain/productos/dto/ProductoResponseDto";
import { CreateProductoDto } from "src/domain/productos/dto/CreateProductoDto";
import { UpdateProductoDto } from "src/domain/productos/dto/UpdateProductoDto";


export class ProductoMapper {
  static ormToDTO(orm: ProductoOrmEntity): ProductoResponseDto {
    const empresa = orm.empresa ? EmpresaMapper.toDomain(orm.empresa) : undefined
    return new ProductoResponseDto(
      orm.productoId,
      orm.empresaId,
      orm.codigo,
      orm.descripcion,
      orm.unidadMedida,
      orm.precioUnitario,
      orm.afectaIgv ?? 0,
      orm.estado,
      empresa
    );
  }
 private static assignCommon(object: ProductoOrmEntity, orm: any, isUpdate = false): ProductoOrmEntity {
     object.empresaId = orm.empresaId ?? 0
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

