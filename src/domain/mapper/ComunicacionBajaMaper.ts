import { EmpresaMapper } from './EmpresaMapper';
import { ComprobanteOrmEntity } from 'src/infrastructure/persistence/comprobante/ComprobanteOrmEntity';
import { BajaComprobanteResponseDto } from '../comunicacion-baja/ComunicacionBajaResponseDto';
import { BajaComprobanteOrmEntity } from 'src/infrastructure/persistence/comunicacion-baja/BajaComprobanteOrmEntity';
import { ComunicacionBajaDetalleMapper } from './ComunicacionBajaDetalleMapper';
import { BajaComprobanteDetalleOrmEntity } from 'src/infrastructure/persistence/comunicacion-baja/BajaComprobanteDetalleOrmEntity';
import { CreateComunicacionBajaDto } from '../comunicacion-baja/interface/create.comunicacion.interface';

export class ComunicacionBajaMaper {
  static toDomain(orm: BajaComprobanteOrmEntity): BajaComprobanteResponseDto {
    const empresa = orm.empresa ? EmpresaMapper.toDomain(orm.empresa) : null;
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
      orm.xml,
      orm.cdr,
      orm.hashComunicacion,
      orm.fechaRespuestaSunat,
      orm.codResPuestaSunat,
      orm.mensajeSunat,
      orm.observacionSunat,
      empresa,
      bajaDetalle
    );
  }
private static assignCommon(
    object: BajaComprobanteOrmEntity,
    data: any,
    isUpdate = false,
  ): BajaComprobanteOrmEntity {
    object.fechaGeneracion = data.fechaGeneracion;
    object.fecReferencia = data.fecReferencia;
    object.correlativo = data.correlativo;
    object.nombreArchivo = data.nombreArchivo;
    object.estado = data.estado;
    object.serie = data.serie
    object.ticket = data.ticket
    object.xml = data.xml;
    object.cdr = data.cdr;
    object.hashComunicacion = data.hashComunicacion;
    // mapear a entidades ORM reales
    object.detalles = data?.detalle?.map((d: any) => {
      const detalle = new BajaComprobanteDetalleOrmEntity();
      detalle.comprobante = { comprobanteId: d.comprobanteId } as ComprobanteOrmEntity;
      detalle.motivo = d.motivo;
      return detalle;
    }) ?? [];
    if (data.empresaId) {
      object.empresa = { empresaId: data.empresaId } as any;
    }
    return object;
  }
  
  static dtoToOrmCreate(dto: CreateComunicacionBajaDto): BajaComprobanteOrmEntity {
    return this.assignCommon(new BajaComprobanteOrmEntity(), dto, false);
  }

}
