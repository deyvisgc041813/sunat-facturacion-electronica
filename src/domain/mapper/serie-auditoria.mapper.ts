
import { SerieAuditoriaOrmEntity } from "src/infrastructure/persistence/tenant/entity/serie-comprobante/serie-auditoria.orm.entity";
import { SerieMapper } from "./serie-comprobante.mapper";
import { SerieAuditoriaResponseDto } from "../tenant/series-auditoria/dto/serie-auditoria.response.dto";
import { CreateSerieAuditoriaDto } from "../tenant/series-auditoria/dto/create.serie-auditoria.dto";
import { UpdateSerieAuditoriaDto } from "../tenant/series-auditoria/dto/update.serie-auditoria.dto";

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
    object.serieAuditoriaId = data?.serieAuditoriaId ?? 0;
    object.usuarioId = data?.usuarioId;
    object.correlativoAnterior = data?.correlativoAnterior;
    object.correlativoNuevo = data?.correlativoNuevo;
    object.motivo = data?.motivo;
    object.fechaCambio = data?.fechaCambio;
    object.serie  = data?.serieId  ? ({ serieId: data.serieId} as any) : null;
    object.sucursalId = data?.sucursalId
    return object;
  }

  static dtoToOrmCreate(dto: CreateSerieAuditoriaDto): SerieAuditoriaOrmEntity {
    return this.assignCommon(new SerieAuditoriaOrmEntity(), dto, false);
  }

  static dtoToOrmUpdate(dto: UpdateSerieAuditoriaDto): SerieAuditoriaOrmEntity {
    return this.assignCommon(new SerieAuditoriaOrmEntity(), dto, true);
  }

}

