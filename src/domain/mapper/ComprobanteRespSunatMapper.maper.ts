import {ComprobanteRespuestaSunatResponseDto } from 'src/domain/comprobante/dto/ConprobanteResponseDto';
import { ComprobanteRespuestaSunatOrmEntity } from 'src/infrastructure/persistence/comprobante/ComprobanteRespuestaSunatOrmEntity';

export class ComprobanteRespSunatMapper {
  static toDomain(orm: ComprobanteRespuestaSunatOrmEntity): ComprobanteRespuestaSunatResponseDto {
    return new ComprobanteRespuestaSunatResponseDto(
      orm.compRespIdSunat,
      orm.xmlFirmado,
      orm.hashCpe,
      orm.cdr,
      orm.createdAt
    );
  }
}
