import { SerieMapper } from './serie-comprobante.mapper';
import { EstadoComunicacionEnvioSunat } from 'src/util/estado.enum';
import { ComprobanteRespSunatMapper } from './comprobante-resp-sunat.maper';
import { ComprobanteOrmEntity } from 'src/infrastructure/persistence/tenant/entity/comprobante/comprobante.orm.entity';
import { ComprobanteResponseDto } from '../tenant/comprobante/dto/conprobante.response.dto';
import { IUpdateComprobante } from '../tenant/comprobante/interface/update.interface';

export class ComprobanteMapper {
  static toDomain(orm: ComprobanteOrmEntity): ComprobanteResponseDto {
    const serie = orm.serie ? SerieMapper.toDomain(orm.serie) : null;
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
      orm.sucursalId,
      orm.clienteId,
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
