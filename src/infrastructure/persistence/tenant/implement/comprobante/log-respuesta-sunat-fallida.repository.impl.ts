import { Injectable } from '@nestjs/common';
import { BaseTenantRepository } from 'src/infrastructure/persistence/base/base-tenant.repository';
import { LogRespuestaSunatOrmEntity } from '../../entity/comprobante/log-respuesta-sunat-fallida.orm.entity';
import { TenantRepositoryHelper } from 'src/domain/parent/conecciones-database/service/tenant-repository.helper';
import { TenantContextService } from 'src/domain/parent/conecciones-database/service/tenant-context.service';

@Injectable()
export class LogRespuestaSunatRepositoryImpl extends BaseTenantRepository<LogRespuestaSunatOrmEntity> {
  constructor(
    tenantRepositoryHelper: TenantRepositoryHelper,
    tenantContext: TenantContextService,
  ) {
    super(tenantContext, tenantRepositoryHelper, LogRespuestaSunatOrmEntity);
  }

  async registrarError(data: {
    comprobanteId: number;
    sucursalId: number;
    estado?: string | null;
    descripcionEstado?: string | null;
    cdr?: Buffer | null;
    xmlFirmado?: string | null;
    hashCpe?: string | null;
    errorMensaje: string;
  }): Promise<void> {
    const repo = await this.getRepository();
    await repo.save(repo.create(data));
  }

  async listarPendientes(limit = 100) {
    const repo = await this.getRepository();
    return repo.find({ take: limit, order: { fechaError: 'ASC' } });
  }

  async eliminarPorId(id: number) {
    const repo = await this.getRepository();
    await repo.delete({ id });
  }
}
