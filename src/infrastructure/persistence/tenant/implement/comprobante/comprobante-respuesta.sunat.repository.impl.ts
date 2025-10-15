import { Injectable } from '@nestjs/common';
import { BaseTenantRepository } from '../../../base/base-tenant.repository';
import { ComprobanteRespuestaSunatOrmEntity } from '../../entity/comprobante/conprobante-respuesta-sunat.orm.entity';
import { TenantContextService } from 'src/domain/parent/conecciones-database/service/tenant-context.service';
import { TenantRepositoryHelper } from 'src/domain/parent/conecciones-database/service/tenant-repository.helper';

@Injectable()
export class ComprobanteRespuestaSunatRepositoryImpl extends BaseTenantRepository<ComprobanteRespuestaSunatOrmEntity> {
  constructor(
    tenantRepositoryHelper: TenantRepositoryHelper,
    tenantContext: TenantContextService
  ) {
    super(tenantContext, tenantRepositoryHelper, ComprobanteRespuestaSunatOrmEntity);
  }

  async saveRespuestaSunat(
    comprobanteId: number,
    cdr: Buffer | null,
    xmlFirmado: string | null,
    hashCpe: string | null,
  ): Promise<void> {
    const repo = await this.getRepository();
    await repo.save({
      comprobante: { comprobanteId },
      cdr,
      xmlFirmado,
      hashCpe,
    });
  }
  async findByComprobanteId(comprobanteId: number) {
    const repo = await this.getRepository();
    return repo.findOne({ where: { comprobante: { comprobanteId } } });
  }

  async deleteByComprobanteId(comprobanteId: number) {
    const repo = await this.getRepository();
    await repo.delete({ comprobante: { comprobanteId } });
  }
}
