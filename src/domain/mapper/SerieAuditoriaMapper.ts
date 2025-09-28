import { SerieAuditoriaResponseDto } from "src/domain/series-auditoria/dto/SerieAuditoriaResponseDto";
import { CreateSerieAuditoriaDto } from "src/domain/series-auditoria/dto/CreateSerieAuditoriaDto";
import { UpdateSerieAuditoriaDto } from "src/domain/series-auditoria/dto/UpdateSerieAuditoriaDto";
import { SerieAuditoriaOrmEntity } from "src/infrastructure/persistence/serie-log/SerieAuditoriaOrmEntity";
import { SerieMapper } from "./SerieMapper";

export class SerieAuditoriaMapper {
  static toDomain (orm: SerieAuditoriaOrmEntity): SerieAuditoriaResponseDto {
    const serie = orm.serie ? SerieMapper.toDomain(orm.serie) : undefined
    const usuario = {}
    return new SerieAuditoriaResponseDto(
      orm.serieAuditoriaId,
      orm.usuarioId,
      orm.correlativoAnterior,
      orm.correlativoNuevo,
      orm.motivo,
      orm.fechaCambio,
      serie,
      usuario
    );
  }
 private static assignCommon(object: SerieAuditoriaOrmEntity, data: any, isUpdate = false): SerieAuditoriaOrmEntity {
    object.serieAuditoriaId = data.serieAuditoriaId ?? 0;
    //object.serieId = data.serieId;
    object.usuarioId = data.usuarioId;
    object.correlativoAnterior = data.correlativoAnterior;
    object.correlativoNuevo = data.correlativoNuevo;
    object.motivo = data.motivo;
    object.fechaCambio = data.fechaCambio;
    return object;
  }

  static dtoToOrmCreate(dto: CreateSerieAuditoriaDto): SerieAuditoriaOrmEntity {
    return this.assignCommon(new SerieAuditoriaOrmEntity(), dto, false);
  }

  static dtoToOrmUpdate(dto: UpdateSerieAuditoriaDto): SerieAuditoriaOrmEntity {
    return this.assignCommon(new SerieAuditoriaOrmEntity(), dto, true);
  }

}

