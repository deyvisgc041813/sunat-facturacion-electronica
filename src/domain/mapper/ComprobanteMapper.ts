import { ComprobanteOrmEntity } from '../../infrastructure/persistence/comprobante/ComprobanteOrmEntity';
import { ComprobanteResponseDto } from 'src/domain/comprobante/dto/ConprobanteResponseDto';
import { ClienteMapper } from './ClienteMapper';
import { IUpdateComprobante } from 'src/domain/comprobante/interface/update.interface';
import { SerieMapper } from './SerieMapper';
import { EstadoComunicacionEnvioSunat } from 'src/util/estado.enum';
import { SucursalMapper } from './SucursalMapper';
import { ComprobanteRespSunatMapper } from './ComprobanteRespSunatMapper.maper';

export class ComprobanteMapper {
  static toDomain(orm: ComprobanteOrmEntity): ComprobanteResponseDto {
    const serie = orm.serie ? SerieMapper.toDomain(orm.serie) : null;
    const sucursal = orm.sucursal ? SucursalMapper.toDomain(orm.sucursal) : null;
    const cliente = orm.cliente ? ClienteMapper.toDomain(orm.cliente) : null;
    const comprobanteRspSunat = orm.respuestaSunat ? ComprobanteRespSunatMapper.toDomain(orm.respuestaSunat) : null
    return new ComprobanteResponseDto(
      orm.comprobanteId,
      orm.numeroComprobante,
      orm.fechaEmision,
      orm.fechaVencimiento,
      orm.moneda ?? '',
      orm.totalGravado ?? 0,
      orm.totalExonerado ?? 0,
      orm.totalInafecto ?? 0,
      orm.totalIgv ?? 0,
      orm.mtoImpVenta ?? 0,
      orm.fechaCreate,
      orm.fechaUpdate,
      orm.estado,
      orm.comunicadoSunat ?? EstadoComunicacionEnvioSunat.NO_ENVIADO,
      orm.serieCorrelativo ?? "",
      sucursal,
      cliente,
      serie,
      comprobanteRspSunat,
      orm.payloadJson,
      orm.fechaAnulacion ?? undefined,
      orm.descripcionEstado,
      orm.icbper
    );
  }

  static dtoToOrmUpdate(dto: IUpdateComprobante): ComprobanteOrmEntity {
    const comprobante = new ComprobanteOrmEntity();
    if (dto.estado !== undefined) {
      comprobante.estado = dto.estado;
    }
    if (dto.descripcionEstado !== undefined) {
      comprobante.descripcionEstado = dto.descripcionEstado;
    }
    comprobante.fechaUpdate = dto.fechaUpdate
    return comprobante;
  }
}
