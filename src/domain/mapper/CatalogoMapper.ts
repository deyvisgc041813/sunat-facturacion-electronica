
import { ResponseCatalogoTipoDTO } from '../catalogo/dto/catalogo.response';
import { CatalogoDetalleMapper } from './CatalogoDetalleMapper';
import { CatalogoTipoOrmEnity } from 'src/infrastructure/persistence/catalogo/CatalogoTipoOrmEnity';
import { CatalogoDetalleOrmEnity } from 'src/infrastructure/persistence/catalogo/CatalogoDetalleOrmEnity';

export class CatalogoMapper {
  static toDomain(orm: CatalogoTipoOrmEnity): ResponseCatalogoTipoDTO {
    const detalle = orm.detalles
      ? orm.detalles?.map((dt) => CatalogoDetalleMapper.toDomain(dt))
      : [];
    return new ResponseCatalogoTipoDTO(
      orm.catalogoTipoId,
      orm.codigoCatalogo,
      orm.descripcion,
      detalle,
    );
  }
  private static assignCommon(
    object: CatalogoTipoOrmEnity,
    data: any,
    isUpdate = false,
  ): CatalogoTipoOrmEnity {
    object.codigoCatalogo = data.codigoCatalogo;
    object.descripcion = data.descripcion;
    object.detalles =
      data.detalle?.map((d: any) => {
        const detalle = new CatalogoDetalleOrmEnity();
        detalle.codigo = d.codigo;
        detalle.descripcion = d.descripcion;
        ((detalle.nombre = d.nombre),
          (detalle.codigoInternacional = d.codigoInternacional));
        detalle.tipoComprobanteAsociado = d.tipoComprobanteAsociado;
        return detalle;
      }) ?? [];
    return object;
  }

  static dtoToOrmCreate(dto: any): CatalogoTipoOrmEnity {
    return this.assignCommon(new CatalogoTipoOrmEnity(), dto, false);
  }

  static dtoToOrmUpdate(dto: any): CatalogoTipoOrmEnity {
    return this.assignCommon(new CatalogoTipoOrmEnity(), dto, true);
  }
}
