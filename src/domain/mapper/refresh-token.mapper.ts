import { RolesOrmEntity } from 'src/infrastructure/persistence/auth/RolesOrmEntity';
import { RefreshTokenDto } from '../auth/dto/refresh.token.dto';
import { UsuariosOrmEntity } from 'src/infrastructure/persistence/auth/UsuariosOrmEntity';
import { RefreshTokenOrmEntity } from 'src/infrastructure/persistence/auth/RefreshTokenOrmEntity';

export class RefreshTokenMapper {
  static toDomain(orm: RefreshTokenOrmEntity): RefreshTokenDto {
    return new RefreshTokenDto(
      orm.token,
      orm?.user?.usuarioId,
      orm.isRevoked,
      orm.expiresAt,
    );
  }
  static toDomainToOrm(orm: RefreshTokenDto): RefreshTokenOrmEntity {
    const refresh = new RefreshTokenOrmEntity();
    ((refresh.token = orm.token), (refresh.isRevoked = orm.isRevoked));
    refresh.expiresAt = orm.expiresAt;
    refresh.user = { usuarioId: orm.userId } as UsuariosOrmEntity;
    return refresh;
  }
  static dtoToOrmCreate(orm: any): RolesOrmEntity {
    const object = new RolesOrmEntity();
    object.name = orm.name;
    return object;
  }
  static dtoToOrmUpdate(orm: any): RolesOrmEntity {
    const object = new RolesOrmEntity();
    object.roleId = orm.roleId;
    object.name = orm.name;
    return object;
  }
}
