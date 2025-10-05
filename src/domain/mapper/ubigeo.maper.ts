import { DepartamentoOrmEntity } from 'src/infrastructure/persistence/ubigeo/departamento.orm.entity';
import {
  DepartamentoResponseDto,
  DistritoResponseDto,
  ProvinciaResponseDto,
} from '../ubigeo/dto/ubigeo.response';
import { ProvinciaOrmEntity } from 'src/infrastructure/persistence/ubigeo/provincia.orm.entity copy';
import { DistritoOrmEntity } from 'src/infrastructure/persistence/ubigeo/distrito.orm.entity';

export class UbigeoMapper {
  static toDomainDepartament(
    orm: DepartamentoOrmEntity,
  ): DepartamentoResponseDto {
    const pronvicia = orm.pronvincia
      ? orm.pronvincia?.map((p) => UbigeoMapper.toDomainPronvince(p))
      : [];
    return new DepartamentoResponseDto(
      orm.departamentoId,
      orm.descripcion,
      orm.ubigeo,
      pronvicia
    );
  }
  static toDomainPronvince(orm: ProvinciaOrmEntity): ProvinciaResponseDto {
    const distrito = orm.distrito
      ? orm.distrito?.map((d) => UbigeoMapper.toDomainDistrict(d))
      : [];
    return new ProvinciaResponseDto(
      orm.provinciaId,
      orm.descripcion,
      orm.ubigeo,
      distrito,
    );
  }
  static toDomainDistrict(orm: DistritoOrmEntity): DistritoResponseDto {
    return new DistritoResponseDto(orm.distritoId, orm.descripcion, orm.ubigeo);
  }
}
