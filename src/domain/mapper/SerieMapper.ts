
import { SerieOrmEntity } from 'src/infrastructure/persistence/serie-comprobante/SerieOrmEntity';
import { SucursalMapper } from './SucursalMapper';
import { SerieResponseDto } from '../serie-comprobante/dto/reesponse.dto';
import { CreateSerieDto } from '../serie-comprobante/dto/create.request.dto';
import { UpdateSerieDto } from '../serie-comprobante/dto/update.request.dto';

export class SerieMapper {
  static toDomain(orm: SerieOrmEntity): SerieResponseDto {
    const sucursal = orm.sucursal
      ? SucursalMapper.toDomain(orm.sucursal)
      : undefined;
    return new SerieResponseDto(
      orm.serieId,
      orm.tipoComprobante,
      orm.serie,
      orm.correlativoInicial ?? 0,
      orm.correlativoActual ?? 0,
      orm.usuarioRegistro,
      orm.fechaRegistro,
      orm.usuarioModificacion,
      orm.fechaModificacion,
      sucursal,
    );
  }
  static mapCommonFields(source: any, target: SerieOrmEntity): void {
    target.serieId = source.serieId ?? 0;
    target.tipoComprobante = source.tipoComprobante;
    target.serie = source.serie;
    target.correlativoInicial = source.correlativoInicial;
    target.sucursal = source.sucursalId  ? ({ sucursalId: source.sucursalId } as any)  : null;
  }

  static dtoToCreate(dto: CreateSerieDto): SerieOrmEntity {
    const entity = new SerieOrmEntity();
    this.mapCommonFields(dto, entity);
    entity.usuarioRegistro = dto.usuarioRegistro ?? '';
    return entity;
  }

  static dtoToOrmUpdate(dto:UpdateSerieDto, serieId:number): SerieOrmEntity {
    const entity = new SerieOrmEntity();
    this.mapCommonFields(dto, entity);
    entity.serieId = serieId;
    entity.usuarioModificacion = dto.usuarioModificacion;
    entity.fechaModificacion = new Date();
    return entity;
  }
}
