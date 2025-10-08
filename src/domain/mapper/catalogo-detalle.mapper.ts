
import { ResponseCatalogoDetalleDTO } from '../catalogo/dto/catalogo.response';
import { CatalogoDetalleOrmEnity } from 'src/infrastructure/persistence/catalogo/CatalogoDetalleOrmEnity';

export class CatalogoDetalleMapper {
  static toDomain(orm: CatalogoDetalleOrmEnity): ResponseCatalogoDetalleDTO {
    return new ResponseCatalogoDetalleDTO(
      orm.detalleCatalogoId,
      orm.codigo,
      orm.descripcion,
      orm.nombre,
      orm.codigoInternacional,
      orm.tipoComprobanteAsociado,
      orm.tipoAfectacion
    );
  }
  private static assignCommon(
    object: CatalogoDetalleOrmEnity,
    data: any,
    isUpdate = false,
  ): CatalogoDetalleOrmEnity {
    object.codigo = data.codigo;
    object.descripcion = data.descripcion;
    object.nombre = data.nombre;
    object.codigoInternacional = data.codigoInternacional;
    object.tipoComprobanteAsociado = data.tipoComprobanteAsociado;
    return object;
  }

  static dtoToOrmCreate(dto: any): CatalogoDetalleOrmEnity {
    return this.assignCommon(new CatalogoDetalleOrmEnity(), dto, false);
  }
}
