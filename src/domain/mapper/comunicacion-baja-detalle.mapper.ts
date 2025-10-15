import { BajaComprobanteDetalleOrmEntity } from 'src/infrastructure/persistence/tenant/entity/comunicacion-baja/baja-comunicacion-detalle.orm.entity';

import { ComprobanteMapper } from './comprobante.mapper';
import { BajaComprobanteDetalleResponseDto } from '../tenant/comunicacion-baja/dto/baja-comprobante-detalle.response.dto';

export class ComunicacionBajaDetalleMapper {
  static toDomain(  orm: BajaComprobanteDetalleOrmEntity): BajaComprobanteDetalleResponseDto {
    const comprobante = orm.comprobante ? ComprobanteMapper.toDomain(orm.comprobante) : null;
    return new BajaComprobanteDetalleResponseDto(
      orm.bajaComprobanteDetalleId,
      orm.motivo ?? "",
      comprobante,
    );
  }

  private static assignCommon( object: BajaComprobanteDetalleOrmEntity, data: any ): BajaComprobanteDetalleOrmEntity {
    object.motivo = data.motivo;
    if (data.bajaId) {
      object.baja = { bajaId: data.bajaId } as any;
    }
    if (data.comprobanteId) {
      object.comprobante = { comprobanteId: data.comprobanteId } as any;
    }
    return object;
  }

  static dtoToOrmCreate(dto: BajaComprobanteDetalleResponseDto): BajaComprobanteDetalleOrmEntity {
    return this.assignCommon(new BajaComprobanteDetalleOrmEntity(), dto);
  }
}
