import {ComprobanteRespuestaSunatResponseDto } from 'src/domain/comprobante/dto/ConprobanteResponseDto';
import { ComprobanteRespuestaSunatOrmEntity } from 'src/infrastructure/persistence/comprobante/ComprobanteRespuestaSunatOrmEntity';

export class ComprobanteRespSunatMapper {
  static toDomain(orm: ComprobanteRespuestaSunatOrmEntity): ComprobanteRespuestaSunatResponseDto {
    return new ComprobanteRespuestaSunatResponseDto(
      orm.compRespIdSunat,
      orm.comprobante.comprobanteId,
      orm.xmlFirmado,
      orm.hashCpe,
      orm.cdr,
      orm.createdAt
    );
  }

  // static dtoToOrmUpdate(dto: IUpdateComprobante): ComprobanteRespuestaSunatOrmEntity {
  //   const comprobante = new ComprobanteRespuestaSunatOrmEntity();
  //   comprobante.compRespIdSunat = dto.
  //   if (dto.estado !== undefined) {
  //     comprobante.estado = dto.estado;
  //   }
  //   if (dto.descripcionEstado !== undefined) {
  //     comprobante.descripcionEstado = dto.descripcionEstado;
  //   }
  //   if (dto.xmlFirmado !== undefined) {
  //     comprobante.xmlFirmado = dto.xmlFirmado;
  //   }
  //   if (dto.hashCpe) {
  //     comprobante.hashCpe = dto.hashCpe;
  //   }
  //   if (dto.cdr !== undefined ) {
  //     comprobante.cdr = dto.cdr
  //   }
  //   comprobante.fechaUpdate = dto.fechaUpdate
  //   return comprobante;
  // }
}
