import { UsuarioResponseDto } from '../auth/dto/usuario/usuario.response.dto';
import { RoleMapper } from './role.mapper';
import { SucursalMapper } from './sucursal.mapper';
import { UpdateUsuarioDto } from '../auth/dto/usuario/update.request.dto';
import { UsuariosOrmEntity } from 'src/infrastructure/persistence/auth/usuario.orm.entity';

export class UsuarioMapper {
  static toDomain(
    orm: UsuariosOrmEntity,
    options?: { incluirClave?: boolean },
  ): UsuarioResponseDto {
    const roles = orm.roles?.map(RoleMapper.toDomain) ?? [];
    const sucursales = orm.sucursales?.map(SucursalMapper.toDomain) ?? [];
    return new UsuarioResponseDto(
      orm.usuarioId,
      orm.correo,
      orm.nombre ?? '',
      orm.estado ?? '1',
      roles,
      sucursales,
      options?.incluirClave ? orm.clave : undefined,
      orm.fecSelecSucursal,
      orm.sucursalActiva,
    );
  }

  static createEntityFromDto(orm: UpdateUsuarioDto): UsuariosOrmEntity {
    const object = new UsuariosOrmEntity();
    object.correo = orm.correo ?? '';
    object.clave = orm.clave ?? '';
    object.nombre = orm.nombre ?? '';
    object.roles = orm.roles ?? [];
    return object;
  }
  static updateEntityFromDto(orm: UpdateUsuarioDto): UsuariosOrmEntity {
    const object = new UsuariosOrmEntity();
    object.usuarioId = orm.usuarioId ?? 0;
    object.correo = orm.correo ?? '';
    object.nombre = orm.nombre ?? '';
    object.roles = orm.roles ?? [];
    return object;
  }
}
