import { SunatLogOrmEntity } from '../../infrastructure/persistence/sunat-log/SunatLogOrmEntity';
import {
  CreateSunatLogDto,
  SunatLogResponseDto,
} from 'src/domain/sunat-log/interface/sunat.log.interface';
import { SucursalMapper } from './SucursalMapper';

export class SunatLogMapper {
  static toDomain(orm: SunatLogOrmEntity): SunatLogResponseDto {
    const sucursal = orm.sucursal
      ? SucursalMapper.toDomain(orm.sucursal)
      : undefined;
    const logs: SunatLogResponseDto = {
      id: orm.id,
      comprobanteId: orm.comprobanteId ?? 0,
      fechaEnvio: orm.fechaEnvio,
      estado: orm.estado,
      request: orm.request,
      response: orm.response,
      resumenId: orm.resumenId,
      sucursal,
      serie: orm.serie,
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
    object.codigoResSunat = data?.codigoResSunat;
    if (data.sucursalId) {
      object.sucursal = { sucursalId: data.sucursalId } as any;
    }
    object.intento = data?.intentos;
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
