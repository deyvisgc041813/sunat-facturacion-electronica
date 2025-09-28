import { ResumenDetalleResponseDto } from 'src/domain/resumen/dto/ResumenDetalleResponseDto';
import { ResumenBoletasDetalleOrmEntity } from 'src/infrastructure/persistence/resumen/ResumenBoletasDetalleOrmEntity';
import { ResumenBoletaDetalleDto } from '../resumen/interface/create.summary.detalle.interface';
import { ComprobanteMapper } from './ComprobanteMapper';
;


export class ResumenBPDetalleMapper {
  static toDomain(
    orm: ResumenBoletasDetalleOrmEntity,
  ): ResumenDetalleResponseDto {
    const comprobante = orm.comprobante
      ? ComprobanteMapper.toDomain(orm.comprobante)
      : null;
    return new ResumenDetalleResponseDto(
      orm.resBolDetId,
      orm.operacion,
      comprobante,
    );
  }

  private static assignCommon( object: ResumenBoletasDetalleOrmEntity,data: any ): ResumenBoletasDetalleOrmEntity {
    object.operacion = data.operacion;
    if (data.resumenId) {
      object.resumen = { resumenId: data.resumenId } as any;
    }
    if (data.comprobanteId) {
      object.comprobante = { comprobanteId: data.comprobanteId } as any;
    }
    return object;
  }

  static dtoToOrmCreate(dto: ResumenBoletaDetalleDto): ResumenBoletasDetalleOrmEntity {
    return this.assignCommon(new ResumenBoletasDetalleOrmEntity(), dto);
  }
}
