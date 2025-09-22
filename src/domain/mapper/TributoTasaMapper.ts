import { TributoTasaResponseDto } from "src/domain/tributo-tasa/dto/TributoTasaResponseDto";
import { formatDateToCompact } from "src/util/Helpers";
import { CreateTributoTasaDto } from "src/domain/tributo-tasa/dto/CreateTributoTasaDto";
import { TributoTasaOrmEntity } from "src/infrastructure/persistence/tasa-tributo/TributoTasaOrmEntity";

export class TributoTasaMapper {
  static toDomain(orm: TributoTasaOrmEntity): TributoTasaResponseDto {
    return {
      id: orm.id,
      codigoSunat: orm.codigoSunat,
      moneda: orm.moneda,
      nombre: orm.nombre,
      vigenciaDesde: formatDateToCompact(orm.vigenciaDesde),
      monto: orm.monto,
      observacion: orm.observacion,
      tasa: orm.tasa,
      vigenciaHasta: formatDateToCompact(orm.vigenciaHasta ?? ""),
    };
  }

  private static assignCommon(
    object: TributoTasaOrmEntity,
    data: any
  ): TributoTasaOrmEntity {
    object.id = data.id;
    object.codigoSunat = data.codigoSunat;
    object.moneda = data.moneda;
    object.nombre = data.nombre;
    object.vigenciaDesde = data.vigenciaDesde;
    object.monto = data.monto;
    object.observacion = data.observacion;
    object.tasa = data.tasa;
    object.vigenciaHasta = data.vigenciaHasta;
    return object;
  }

  static dtoToOrmCreate(dto: CreateTributoTasaDto): TributoTasaOrmEntity {
    return this.assignCommon(new TributoTasaOrmEntity(), dto);
  }
}
