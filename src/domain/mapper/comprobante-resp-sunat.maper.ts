import { ComprobanteRespuestaSunatOrmEntity } from "src/infrastructure/persistence/tenant/entity/comprobante/conprobante-respuesta-sunat.orm.entity";
import { ComprobanteRespuestaSunatResponseDto } from "../tenant/comprobante/dto/conprobante.response.dto";


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
