import { ComprobanteMapper } from './comprobante.maper';
import { BajaComprobanteDetalleOrmEntity } from 'src/infrastructure/persistence/comunicacion-baja/BajaComprobanteDetalleOrmEntity';
import { BajaComprobanteDetalleResponseDto } from '../comunicacion-baja/BajaComprobanteDetalleResponseDto';

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
