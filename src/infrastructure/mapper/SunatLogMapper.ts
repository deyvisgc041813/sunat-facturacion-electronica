import { SunatLogOrmEntity } from '../database/entity/SunatLogOrmEntity';
import { CreateSunatLogDto, SunatLogResponseDto } from 'src/domain/sunat-log/interface/sunat.log.interface';

export class SunatLogMapper {
  static toDomain(orm: SunatLogOrmEntity): SunatLogResponseDto {
    const logs: SunatLogResponseDto = {
       id: orm.id,
      comprobanteId: orm.comprobanteId,
      fechaEnvio: orm.fechaEnvio,

      estado: orm.estado,
      request: orm.request,
      response: orm.response
    }
    return logs;
  }
  private static assignCommon(
    object: SunatLogOrmEntity,
    data: any
  ): SunatLogOrmEntity {
    object.comprobanteId = data.comprobanteId;
    object.fechaEnvio = data.fechaEnvio;
    object.estado = data.estado;
    object.request = data.request;
    object.response = data.response;
    return object;
  }

  static dtoToOrmCreate(dto: CreateSunatLogDto): SunatLogOrmEntity {
    return this.assignCommon(new SunatLogOrmEntity(), dto);
  }
}
