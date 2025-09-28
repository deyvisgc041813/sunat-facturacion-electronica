import { SerieResponseDto } from 'src/domain/series/dto/SerieResponseDto';
import { CreateSerieDto } from 'src/domain/series/dto/CreateSerieDto';
import { UpdateSerieDto } from 'src/domain/series/dto/UpdateSerieDto';
import { SerieOrmEntity } from 'src/infrastructure/persistence/serie/SerieOrmEntity';
import { SucursalMapper } from './SucursalMapper';

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
      sucursal,
    );
  }
  private static assignCommon(
    object: SerieOrmEntity,
    data: any,
    isUpdate = false,
  ): SerieOrmEntity {
    object.serieId = data.serieId ?? 0;
    object.tipoComprobante = data.tipoComprobante;
    object.serie = data.serie;
    object.correlativoInicial = data.correlativoInicial;

    if (data.sucursalId) {
      object.sucursal = { sucursalId: data.sucursalId } as any;
    }

    return object;
  }

  static dtoToOrmCreate(dto: CreateSerieDto): SerieOrmEntity {
    return this.assignCommon(new SerieOrmEntity(), dto, false);
  }

  static dtoToOrmUpdate(dto: UpdateSerieDto): SerieOrmEntity {
    return this.assignCommon(new SerieOrmEntity(), dto, true);
  }
}
