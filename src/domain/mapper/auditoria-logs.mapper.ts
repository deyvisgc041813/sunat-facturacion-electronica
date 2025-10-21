
import { AuditoriaLogOrmEntity } from "src/infrastructure/persistence/parent/entity/auditoria.log.orm.entity";
import { AuditoriaLogsResponseDto } from "../parent/core/logs/dto/auditoria-logs.response.dto";
import { ICreateAuditoriaLog } from "../parent/core/logs/dto/create.auditoria-logs";

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
      orm.sucursalId ?? 0,
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

