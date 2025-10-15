import { TenantConnectionsResponseDto } from '../dto/tenant-database.response.dto';

export interface ITenantDatabaseRepositoryPort {
  save(
    sucursalId: number,
    dbName: string,
    dbUser: string,
    dbPassword: string,
  ): Promise<void>;
  activate(sucursalId: number, dbName: string): Promise<void>;
  findBySubDominio(
    sucursalId: number,
    subDominio: string,
  ): Promise<TenantConnectionsResponseDto | null>;
  findByDbUser(dbUser: string): Promise<TenantConnectionsResponseDto | null>;
  delete(dbUser: string, sucursalesId: number): Promise<void>;
}
