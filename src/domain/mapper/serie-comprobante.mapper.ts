
import { SerieOrmEntity } from 'src/infrastructure/persistence/tenant/entity/serie-comprobante/serie-comprobante.orm.entity';
import { CreateSerieDto } from '../tenant/serie-comprobante/dto/create.request.dto';
import { UpdateSerieDto } from '../tenant/serie-comprobante/dto/update.request.dto';
import { SerieResponseDto } from '../tenant/serie-comprobante/dto/reesponse.dto';

export class SerieMapper {
  static toDomain(orm: SerieOrmEntity): SerieResponseDto {
    return new SerieResponseDto(
      orm.serieId,
      orm.sucursalId,
      orm.tipoComprobante,
      orm.serie,
      orm.correlativoInicial ?? 0,
      orm.correlativoActual ?? 0,
      orm.usuarioRegistro,
      orm.fechaRegistro,
      orm.usuarioModificacion,
      orm.fechaModificacion
    );
  }
  static mapCommonFields(source: any, target: SerieOrmEntity): void {
    target.serieId = source.serieId ?? 0;
    target.tipoComprobante = source.tipoComprobante;
    target.serie = source.serie;
    target.correlativoInicial = source.correlativoInicial;
    target.sucursalId = source.sucursalId
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
