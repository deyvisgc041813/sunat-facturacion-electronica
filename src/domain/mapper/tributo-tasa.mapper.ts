import { formatDateToCompact } from "src/util/Helpers";
import { TributoTasaOrmEntity } from "src/infrastructure/persistence/parent/entity/tributo-tasa.orm.entity";
import { TributoTasaResponseDto } from "../parent/tributo-tasa/dto/response.tributo-tasa.dto";
import { CreateTributoTasaDto } from "../parent/tributo-tasa/dto/create.tributo-tasa.dto";

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
