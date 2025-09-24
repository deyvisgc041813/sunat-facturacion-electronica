import { ResumenBoletasOrmEntity } from 'src/infrastructure/persistence/resumen/ResumenBoletasOrmEntity';
import { EmpresaMapper } from './EmpresaMapper';
import { ResumenResponseDto } from 'src/domain/resumen/dto/ResumenResponseDto';
import { ResumenBPDetalleMapper } from './ResumenBPDetalleMapper';
import { CreateResumenBoletaDto } from '../resumen/interface/create.summary.interface';
import { ResumenBoletaDetalleDto } from '../resumen/interface/create.summary.detalle.interface';
import { ResumenBoletasDetalleOrmEntity } from 'src/infrastructure/persistence/resumen/ResumenBoletasDetalleOrmEntity';
import { ComprobanteOrmEntity } from 'src/infrastructure/persistence/comprobante/ComprobanteOrmEntity';

export class ResumenBPMaper {
  static toDomain(orm: ResumenBoletasOrmEntity): ResumenResponseDto {
    const empresa = orm.empresa ? EmpresaMapper.toDomain(orm.empresa) : null;
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
      orm.fechaRespuestaSunat,
      orm.codResPuestaSunat,
      orm.mensajeSunat,
      orm.xml,
      orm.cdr,
      orm.hashResumen,
      orm.observacionSunat,
      empresa,
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

    if (data.empresaId) {
      object.empresa = { empresaId: data.empresaId } as any;
    }

    object.ticket = data.ticket;
    object.resumenId = data.resumenId;
    return object;
  }

  static dtoToOrmCreate(dto: CreateResumenBoletaDto): ResumenBoletasOrmEntity {
    return this.assignCommon(new ResumenBoletasOrmEntity(), dto, false);
  }

  // static dtoToOrmUpdate(dto: ISummaryDocument): ResumenBoletasOrmEntity {
  //   return this.assignCommon(new ResumenBoletasOrmEntity(), dto, true);
  // }
}
