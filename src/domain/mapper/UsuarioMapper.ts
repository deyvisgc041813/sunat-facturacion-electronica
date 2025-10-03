import { UsuarioResponseDto } from '../auth/dto/usuario/usuario.response.dto';
import { UsuariosOrmEntity } from 'src/infrastructure/persistence/auth/UsuariosOrmEntity';
import { RoleMapper } from './RoleMapper';
import { SucursalMapper } from './SucursalMapper';
import { SerieAuditoriaMapper } from './SerieAuditoriaMapper';
import { UpdateUsuarioDto } from '../auth/dto/usuario/update.request.dto';

export class UsuarioMapper {
  // static toDomain(orm: UsuariosOrmEntity): UsuarioResponseDto {
  //   const roles = orm.roles ? orm.roles.map((r) => RoleMapper.toDomain(r)) : [];
  //   const sucursales = orm.sucursales
  //     ? orm.sucursales.map((s) => SucursalMapper.toDomain(s))
  //     : [];
  //   const auditoriaSeries = orm.auditorias
  //     ? orm.auditorias.map((a) => SerieAuditoriaMapper.toDomain(a))
  //     : [];
  //   return new UsuarioResponseDto(
  //     orm.usuarioId,
  //     orm.correo,
  //     orm.nombre,
  //     orm.estado,
  //     roles,
  //     sucursales,
  //     undefined,
  //     auditoriaSeries,
  //     orm.fecSelecSucursal,
  //     orm.sucursalActiva
  //   );
  // }
  // static toDomainInterno(orm: UsuariosOrmEntity): UsuarioResponseDto {
  //   const roles = orm.roles ? orm.roles.map((r) => RoleMapper.toDomain(r)) : [];
  //   const sucursales = orm.sucursales
  //     ? orm.sucursales.map((s) => SucursalMapper.toDomain(s))
  //     : [];
  //   const auditoriaSeries = orm.auditorias
  //     ? orm.auditorias.map((a) => SerieAuditoriaMapper.toDomain(a))
  //     : [];
  //   return new UsuarioResponseDto(
  //     orm.usuarioId,
  //     orm.correo,
  //     orm.nombre,
  //     orm.estado,
  //     roles,
  //     sucursales,
  //     orm.clave,
  //     auditoriaSeries,
  //     orm.fecSelecSucursal,
  //     orm.sucursalActiva
  //   );
  // }
  static toDomain(
    orm: UsuariosOrmEntity,
    options?: { incluirClave?: boolean },
  ): UsuarioResponseDto {
    const roles = orm.roles?.map(RoleMapper.toDomain) ?? [];
    const sucursales = orm.sucursales?.map(SucursalMapper.toDomain) ?? [];
    const auditoriaSeries =
      orm.auditorias?.map(SerieAuditoriaMapper.toDomain) ?? [];
    return new UsuarioResponseDto(
      orm.usuarioId,
      orm.correo,
      orm.nombre ?? '',
      orm.estado ?? '1',
      roles,
      sucursales,
      options?.incluirClave ? orm.clave : undefined,
      auditoriaSeries,
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
    object.sucursales = orm.sucursales ?? [];
    return object;
  }
  static updateEntityFromDto(orm: UpdateUsuarioDto): UsuariosOrmEntity {
    const object = new UsuariosOrmEntity();
    object.usuarioId = orm.usuarioId ?? 0;
    object.correo = orm.correo ?? '';
    object.nombre = orm.nombre ?? '';
    object.roles = orm.roles ?? [];
    object.sucursales = orm.sucursales ?? [];
    return object;
  }
}
