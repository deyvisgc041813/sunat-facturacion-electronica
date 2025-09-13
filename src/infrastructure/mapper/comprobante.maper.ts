import { SerieMapper } from './SerieMapper';
import { ComprobanteOrmEntity } from '../database/entity/ComprobanteOrmEntity';
import { ComprobanteResponseDto } from 'src/domain/comprobante/dto/ConprobanteResponseDto';
import { EmpresaMapper } from './EmpresaMapper';
import { ClienteMapper } from './ClienteMapper';
import { CreateComprobanteDto } from 'src/domain/comprobante/dto/CreateComprobanteDto';
import { IUpdateComprobante } from 'src/domain/comprobante/interface/update.interface';

export class ComprobanteMapper {
  static toDomain(orm: ComprobanteOrmEntity): ComprobanteResponseDto {
    const serie = orm.serie ? SerieMapper.toDomain(orm.serie) : null;
    const empresa = orm.empresa ? EmpresaMapper.toDomain(orm.empresa) : null;
    const cliente = orm.cliente ? ClienteMapper.toDomain(orm.cliente) : null;
    return new ComprobanteResponseDto(
      orm.comprobanteId,
      orm.numeroComprobante,
      orm.fechaEmision,
      orm.moneda ?? '',
      orm.totalGravado ?? 0,
      orm.totalExonerado ?? 0,
      orm.totalInafecto ?? 0,
      orm.totalIgv ?? 0,
      orm.total ?? 0,
      orm.estado,
      empresa,
      cliente,
      serie,
      orm.hashCpe,
      orm.payloadJson,
    );
  }
  private static assignCommon(
    object: ComprobanteOrmEntity,
    data: any,
  ): ComprobanteOrmEntity {
    object.empresaId = data.empresaId ?? 0;
    object.clienteId = data.clienteId;
    object.serieId = data.serieId;
    object.numeroComprobante = data.numeroComprobante;
    object.fechaEmision = data.fechaEmision;
    object.moneda = data.moneda;
    object.totalGravado = data.totalGravado;
    object.totalExonerado = data.totalExonerado;
    object.totalInafecto = data.totalInafecto;
    object.totalIgv = data.totalIgv;
    object.total = data.total;
    object.payloadJson = data.payloadJson;
    return object;
  }

  static dtoToOrmCreate(dto: CreateComprobanteDto): ComprobanteOrmEntity {
    return this.assignCommon(new ComprobanteOrmEntity(), dto);
  }
  static dtoToOrmUpdate(dto: IUpdateComprobante): ComprobanteOrmEntity {
    const comprobante = new ComprobanteOrmEntity();
    if (dto.estado !== undefined) {
      comprobante.estado = dto.estado;
    }
    if (dto.motivoEstado !== undefined) {
      comprobante.motivoEstado = dto.motivoEstado;
    }

    if (dto.xmlFirmado !== undefined) {
      comprobante.xmlFirmado = dto.xmlFirmado;
    }
    if (dto.hashCpe !== undefined) {
      comprobante.hashCpe = dto.hashCpe;
    }
    if (dto.cdr !== undefined) {
      comprobante.cdr = dto.cdr;
    }
    if (dto.cdr !== undefined) {
      comprobante.cdr = dto.cdr;
    }
    return comprobante;
  }
}
