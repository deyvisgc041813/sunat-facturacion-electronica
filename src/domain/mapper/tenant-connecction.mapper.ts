import { TenantConnectionOrmEntity } from 'src/infrastructure/persistence/parent/entity/tenant.coneccion.orm.entity';
import { TenantConnectionsResponseDto } from '../parent/conecciones-database/dto/tenant-database.response.dto';
import { SucursalMapper } from './sucursal.mapper';

export class TenantConecctionMapper {
  static toDomain(orm: TenantConnectionOrmEntity): TenantConnectionsResponseDto {
    const sucursal = orm.sucursal ? SucursalMapper.toDomain(orm?.sucursal) : undefined
    return new TenantConnectionsResponseDto(
       orm.coneccionId,
      orm.dbName,
      orm.estado,
      orm.fechaRegistro,
      orm.dbUser,
      orm.dbPassword,
      orm.dbHost,
      orm.dbPort,
      sucursal
    );
  }
}