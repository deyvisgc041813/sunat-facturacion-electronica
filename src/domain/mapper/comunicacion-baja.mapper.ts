
import { BajaComprobanteOrmEntity } from 'src/infrastructure/persistence/tenant/entity/comunicacion-baja/baja-comprobante.orm.entity';
import { ComunicacionBajaDetalleMapper } from './comunicacion-baja-detalle.mapper';
import { BajaComprobanteDetalleOrmEntity } from 'src/infrastructure/persistence/tenant/entity/comunicacion-baja/baja-comunicacion-detalle.orm.entity';
import { ComprobanteOrmEntity } from 'src/infrastructure/persistence/tenant/entity/comprobante/comprobante.orm.entity';
import { CreateComunicacionBajaDto } from '../tenant/comunicacion-baja/interface/create.comunicacion.interface';
import { BajaComprobanteResponseDto } from '../tenant/comunicacion-baja/dto/ComunicacionBajaResponseDto';

export class ComunicacionBajaMaper {
  static toDomain(orm: BajaComprobanteOrmEntity): BajaComprobanteResponseDto {
    const bajaDetalle = orm.detalles  ? orm.detalles?.map((d) => ComunicacionBajaDetalleMapper.toDomain(d)) : [];
    return new BajaComprobanteResponseDto(
      orm.bajaComprobanteId,
      orm.fechaGeneracion, // fecha de envio y generacion del envio del resumen
      orm.fecReferencia, // fecha de emision de los comprobantes.
      orm.correlativo,
      orm.nombreArchivo,
      orm.estado,
      orm.serie,
      orm.ticket ?? "",
      orm.sucursalId,
      orm.xml,
      orm.cdr,
      orm.hashComunicacion,
      orm.fechaRespuestaSunat,
      orm.codResPuestaSunat,
      orm.mensajeSunat,
      orm.observacionSunat,
      bajaDetalle
    );
  }
private static assignCommon(
    object: BajaComprobanteOrmEntity,
    data: any,
    isUpdate = false,
  ): BajaComprobanteOrmEntity {
    object.fechaGeneracion = data?.fechaGeneracion;
    object.fecReferencia = data?.fecReferencia;
    object.correlativo = data?.correlativo;
    object.nombreArchivo = data?.nombreArchivo;
    object.estado = data?.estado;
    object.serie = data?.serie
    object.ticket = data?.ticket
    object.xml = data?.xml;
    object.cdr = data?.cdr;
    object.hashComunicacion = data?.hashComunicacion;
    object.sucursalId = data.sucursalId
    // mapear a entidades ORM reales
    object.detalles = data?.detalle?.map((d: any) => {
      const detalle = new BajaComprobanteDetalleOrmEntity();
      detalle.comprobante = { comprobanteId: d.comprobanteId } as ComprobanteOrmEntity;
      detalle.motivo = d.motivo;
      return detalle;
    }) ?? [];
    return object;
  }
  
  static dtoToOrmCreate(dto: CreateComunicacionBajaDto): BajaComprobanteOrmEntity {
    return this.assignCommon(new BajaComprobanteOrmEntity(), dto, false);
  }

}
