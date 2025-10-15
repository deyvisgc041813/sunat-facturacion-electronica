import { Injectable } from '@nestjs/common';
import { DataSource, EntityTarget, Repository, ObjectLiteral } from 'typeorm';
import { TenantDatabaseService } from './tenant-database.service';

@Injectable()
export class TenantRepositoryHelper {
  constructor(private readonly tenantDatabaseService: TenantDatabaseService) {}

  /**
   * Obtiene el repositorio dinámico de un tenant (base hija)
   * @param tenantName Nombre de la base de datos del tenant
   * @param entity Entidad TypeORM asociada
   */
  async getTenantRepository<T extends ObjectLiteral>(
    tenantName: string,
    entity: EntityTarget<T>,
    sucursalId:number
  ): Promise<Repository<T>> {
    const connection: DataSource = await this.tenantDatabaseService.getTenantConnection(sucursalId, tenantName);
    return connection.getRepository<T>(entity);
  }
}
