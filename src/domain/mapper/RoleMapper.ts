import { RolesOrmEntity } from "src/infrastructure/persistence/auth/RolesOrmEntity";
import { RoleRequestDto } from "../auth/dto/usuario/usuario.response.dto";

export class RoleMapper {
  static toDomain(orm: RolesOrmEntity): RoleRequestDto {
    return new RoleRequestDto(
      orm.roleId,
      orm.name
    );
  }
  static dtoToOrmCreate(orm: any): RolesOrmEntity {
     const object = new RolesOrmEntity()
     object.name = orm.name
     return object
  }
   static dtoToOrmUpdate(orm: any): RolesOrmEntity {
     const object = new RolesOrmEntity()
     object.roleId = orm.roleId
     object.name = orm.name
     return object
  }
}

