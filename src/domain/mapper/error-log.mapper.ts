

import { ErrorLogResponseDto } from 'src/domain/error-log/dto/ErrorLogResponseDto';
import { CreateErrorLogDto } from 'src/domain/error-log/dto/CreateErrorLogDto';
import { ErrorLogOrmEntity } from 'src/infrastructure/persistence/error-log/ErrorLogOrmEntity';

export class ErrorLogMapper {
  static toDomain(orm: ErrorLogOrmEntity): ErrorLogResponseDto {
    return new ErrorLogResponseDto(
      orm.errorId,
      orm.tipoComprobante,
      orm.serie,
      orm.correlativo,
      orm.origen,
      orm.codigoError,
      orm.mensajeError,
      orm.detalleError,
      orm.fechaCreacion,
      orm.estado,
    );
  }
  private static assignCommon(
    object: ErrorLogOrmEntity,
    data: any,
    isUpdate = false,
  ): ErrorLogOrmEntity {
    object.tipoComprobante = data.tipoComprobante;
    object.serie = data.serie;
    object.correlativo = data.correlativo;
    object.origen = data.origen;
    object.codigoError = data.codigoError;
    object.mensajeError = data.mensajeError;
    object.detalleError = data.detalleError;
    return object;
  }

  static dtoToOrmCreate(dto: CreateErrorLogDto): ErrorLogOrmEntity {
    return this.assignCommon(new ErrorLogOrmEntity(), dto, false);
  }
}
