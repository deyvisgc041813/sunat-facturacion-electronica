
import { SunatLogOrmEntity } from 'src/infrastructure/persistence/tenant/entity/sunat-log.orm.entity';
import { CreateSunatLogDto, SunatLogResponseDto } from '../tenant/sunat-log/interface/sunat.log.interface';

export class SunatLogMapper {
  static toDomain(orm: SunatLogOrmEntity): SunatLogResponseDto {
    const logs: SunatLogResponseDto = {
      id: orm.id,
      comprobanteId: orm?.comprobanteId ?? 0,
      fechaEnvio: orm?.fechaEnvio,
      estado: orm?.estado,
      request: orm?.request,
      response: orm?.response,
      resumenId: orm?.resumenId,
      sucursalId: orm?.sucursalId,
      serie: orm?.serie,
    };
    return logs;
  }
  private static assignCommon(
    object: SunatLogOrmEntity,
    data: any,
  ): SunatLogOrmEntity {
    object.comprobanteId = data?.comprobanteId > 0 ? data.comprobanteId : null;
    object.fechaEnvio = data?.fechaEnvio;
    object.estado = data?.estado;
    object.request = data?.request;
    object.response = data?.response;
    object.resumenId = data?.resumenId ? data.resumenId : null;
    object.codigoResSunat = data?.codigoResSunat;
    object.sucursalId = data?.sucursalId;
    object.usuarioEnvio = data?.usuarioEnvio
    object.fechaRespuesta = data?.fechaRespuesta;
    object.serie = data?.serie;
    object.bajaId = data?.bajaId
    return object;
  }

  static dtoToOrmCreate(dto: CreateSunatLogDto): SunatLogOrmEntity {
    return this.assignCommon(new SunatLogOrmEntity(), dto);
  }
}
