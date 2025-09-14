import { SerieMapper } from './SerieMapper';
import { ComprobanteOrmEntity } from '../database/entity/ComprobanteOrmEntity';
import { ComprobanteResponseDto } from 'src/domain/comprobante/dto/ConprobanteResponseDto';
import { EmpresaMapper } from './EmpresaMapper';
import { ClienteMapper } from './ClienteMapper';
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
      orm.mtoImpVenta ?? 0,
      orm.fechaCreate,
      orm.fechaUpdate,
      orm.estado,
      empresa,
      cliente,
      serie,
      orm.hashCpe,
      orm.payloadJson,
    );
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
    if (dto.hashCpe) {
      comprobante.hashCpe = dto.hashCpe;
    }
    if (dto.cdr !== undefined ) {
      comprobante.cdr = dto.cdr
    }
    comprobante.fechaUpdate = dto.fechaUpdate
    return comprobante;
  }
}
