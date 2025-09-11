import { SerieOrmEntity } from "../database/entity/SerieOrmEntity";
import { SerieResponseDto } from "src/domain/series/dto/SerieResponseDto";
import { EmpresaMapper } from "./EmpresaMapper";
import { CreateSerieDto } from "src/domain/series/dto/CreateSerieDto";
import { UpdateSerieDto } from "src/domain/series/dto/UpdateSerieDto";

export class SerieMapper {
  static toDomain (orm: SerieOrmEntity): SerieResponseDto {
    const empresa = orm.empresa ? EmpresaMapper.toDomain(orm.empresa) : undefined
    return new SerieResponseDto(
      orm.serieId,
      orm.tipoComprobante,
      orm.serie,
      orm.correlativoInicial ?? 0,
      empresa
    );
  }
 private static assignCommon(object: SerieOrmEntity, data: any, isUpdate = false): SerieOrmEntity {
    object.serieId = data.serieId ?? 0;
    object.empresaId = data.empresaId
    object.tipoComprobante = data.tipoComprobante;
    object.serie = data.serie;
    object.correlativoInicial = data.correlativoInicial;
    return object;
  }

  static dtoToOrmCreate(dto: CreateSerieDto): SerieOrmEntity {
    return this.assignCommon(new SerieOrmEntity(), dto, false);
  }

  static dtoToOrmUpdate(dto: UpdateSerieDto): SerieOrmEntity {
    return this.assignCommon(new SerieOrmEntity(), dto, true);
  }

}

