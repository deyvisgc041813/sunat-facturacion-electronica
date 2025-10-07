import { AuditoriaLogsResponseDto } from "../core/logs/dto/auditoria-logs.response";
import { AuditoriaLogOrmEntity } from "src/infrastructure/persistence/core/logs/auditoria.log-orm.entity";
import { ICreateAuditoriaLog } from "../core/logs/dto/create.request.auditoria-logs";

export class AuditoriaLogsMapper {
  static toDomain(orm: AuditoriaLogOrmEntity): AuditoriaLogsResponseDto {
    return new AuditoriaLogsResponseDto(
      orm.logId,
      orm.tablaAfectada,
      orm.registroId ?? 0,
      orm.accion,
      orm.valoresAnteriores,
      orm.valoresNuevos,
      orm.usuarioId,
      orm.nombreUsuario ?? "",
      orm.sucursalId,
      orm.aplicacionOrigen ?? "",
      orm.entorno,
      orm.observacion
    );
  }
  static dtoToOrmCreate(orm: ICreateAuditoriaLog): AuditoriaLogOrmEntity {
     const object = new AuditoriaLogOrmEntity()
     object.tablaAfectada = orm.tablaAfectada
     object.registroId = orm.registroId
     object.accion = orm.accion
     object.valoresAnteriores = orm.valoresAnteriores
     object.valoresNuevos = orm.valoresNuevos
     object.usuarioId = orm.usuarioId
     object.nombreUsuario = orm.nombreUsuario,
     object.sucursalId = orm.sucursalId ?? 0
     object.aplicacionOrigen = orm.aplicacionOrigen
     object.entorno = orm.entorno
     object.observacion = orm.observacion
     return object
  }
}

