import { ResumenBoletasOrmEntity } from 'src/infrastructure/persistence/tenant/entity/resumen/resumen-bp.orm.entity';
import { ResumenBPDetalleMapper } from './resumen-bp-detalle.mapper';
import { ResumenBoletasDetalleOrmEntity } from 'src/infrastructure/persistence/tenant/entity/resumen/resumen-bp-detalle.orm.entity';
import { ResumenResponseDto } from '../tenant/resumen/dto/resumen.response.dto';
import { ComprobanteOrmEntity } from 'src/infrastructure/persistence/tenant/entity/comprobante/comprobante.orm.entity';
import { CreateResumenBoletaDto } from '../tenant/resumen/interface/create.summary.interface';

export class ResumenBPMaper {
  static toDomain(orm: ResumenBoletasOrmEntity): ResumenResponseDto {
    const resumenDetalle = orm.detalles
      ? orm.detalles?.map((d) => ResumenBPDetalleMapper.toDomain(d))
      : [];
    return new ResumenResponseDto(
      orm.resBolId,
      orm.fechaGeneracion, // fecha de envio y generacion del envio del resumen
      orm.fechaReferencia, // fecha de emision de los comprobantes.
      orm.correlativo,
      orm.nombreArchivo,
      orm.estado,
      orm.ticket,
      orm.resumenId,
      orm.sucursalId,
      orm.fechaRespuestaSunat,
      orm.codResPuestaSunat,
      orm.mensajeSunat,
      orm.xml,
      orm.cdr,
      orm.hashResumen,
      orm.observacionSunat,
      resumenDetalle,
    );
  }
  private static assignCommon(
    object: ResumenBoletasOrmEntity,
    data: any,
    isUpdate = false,
  ): ResumenBoletasOrmEntity {
    object.fechaGeneracion = data.fechaGeneracion;
    object.fechaReferencia = data.fecReferencia;
    object.correlativo = data.correlativo;
    object.nombreArchivo = data.nombreArchivo;
    object.estado = data.estado;
    object.xml = data.xml;
    object.cdr = data.cdr;
    object.hashResumen = data.hashResumen;

    // mapear a entidades ORM reales
    object.detalles =
      data.detalle?.map((d: any) => {
        const detalle = new ResumenBoletasDetalleOrmEntity();
        detalle.comprobante = {
          comprobanteId: d.comprobanteId,
        } as ComprobanteOrmEntity;
        detalle.operacion = d.operacion;
        return detalle;
      }) ?? [];
    object.sucursalId = data.sucursalId;  
    object.ticket = data.ticket;
    object.resumenId = data.resumenId;
    return object;
  }

  static dtoToOrmCreate(dto: CreateResumenBoletaDto): ResumenBoletasOrmEntity {
    return this.assignCommon(new ResumenBoletasOrmEntity(), dto, false);
  }
}
