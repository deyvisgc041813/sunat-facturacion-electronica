import { UsuarioResponseDto } from '../auth/dto/usuario/usuario.response.dto';
import { UsuariosOrmEntity } from 'src/infrastructure/persistence/auth/UsuariosOrmEntity';
import { RoleMapper } from './RoleMapper';
import { SucursalMapper } from './SucursalMapper';
import { SerieAuditoriaMapper } from './SerieAuditoriaMapper';

export class UsuarioMapper {
  static toDomain(orm: UsuariosOrmEntity): UsuarioResponseDto {
    const roles = orm.roles ? orm.roles.map((r) => RoleMapper.toDomain(r)) : [];
    const sucursales = orm.sucursales
      ? orm.sucursales.map((s) => SucursalMapper.toDomain(s))
      : [];
    const auditoriaSeries = orm.auditorias
      ? orm.auditorias.map((a) => SerieAuditoriaMapper.toDomain(a))
      : [];
    return new UsuarioResponseDto(
      orm.usuarioId,
      orm.correo,
      orm.nombre,
      orm.estado,
      roles,
      sucursales,
      orm.clave,
      auditoriaSeries,
    );
  }
}