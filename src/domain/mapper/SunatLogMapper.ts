import { SunatLogOrmEntity } from '../../infrastructure/persistence/sunat-log/SunatLogOrmEntity';
import {
  CreateSunatLogDto,
  SunatLogResponseDto,
} from 'src/domain/sunat-log/interface/sunat.log.interface';

export class SunatLogMapper {
  static toDomain(orm: SunatLogOrmEntity): SunatLogResponseDto {
    const logs: SunatLogResponseDto = {
      id: orm.id,
      comprobanteId: orm.comprobanteId ?? 0,
      fechaEnvio: orm.fechaEnvio,
      estado: orm.estado,
      request: orm.request,
      response: orm.response,
      resumenId: orm.resumenId
    };
    return logs;
  }
  private static assignCommon(
    object: SunatLogOrmEntity,
    data: any,
  ): SunatLogOrmEntity {
    object.comprobanteId = data.comprobanteId > 0 ? data.comprobanteId : null;
    object.fechaEnvio = data?.fechaEnvio;
    object.estado = data?.estado;
    object.request = data?.request;
    object.response = data?.response;
    object.resumenId = data?.resumenId ? data.resumenId : null;
    object.codigoResumenSunat = data?.codigoResumenSunat
    return object;
  }

  static dtoToOrmCreate(dto: CreateSunatLogDto): SunatLogOrmEntity {
    return this.assignCommon(new SunatLogOrmEntity(), dto);
  }
}
