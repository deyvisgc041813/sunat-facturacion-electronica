import { Injectable } from '@nestjs/common';
import { BaseTenantRepository } from '../../../base/base-tenant.repository';
import { ComprobanteRespuestaSunatOrmEntity } from '../../entity/comprobante/conprobante-respuesta-sunat.orm.entity';
import { TenantContextService } from 'src/domain/parent/conecciones-database/service/tenant-context.service';
import { TenantRepositoryHelper } from 'src/domain/parent/conecciones-database/service/tenant-repository.helper';
import { ArchivoDescargable } from 'src/domain/tenant/comprobante/comprobante.repository';
import { BusinessLogicException } from 'src/adapter/web/exception/exeception-dynamic';

@Injectable()
export class ComprobanteRespuestaSunatRepositoryImpl extends BaseTenantRepository<ComprobanteRespuestaSunatOrmEntity> {
  constructor(
    tenantRepositoryHelper: TenantRepositoryHelper,
    tenantContext: TenantContextService,
  ) {
    super(
      tenantContext,
      tenantRepositoryHelper,
      ComprobanteRespuestaSunatOrmEntity,
    );
  }

  async create(
    comprobanteId: number,
    cdr: Buffer | null,
    xmlFirmado: string | null,
    hashCpe: string | null,
    tenantDatabase?: string,
  ): Promise<void> {
    const repo = await this.getRepository(tenantDatabase);
    await repo.save({
      comprobante: { comprobanteId },
      cdr,
      xmlFirmado,
      hashCpe,
    });
  }
  async update(
    compRespIdSunat:number,
    comprobanteId: number,
    cdr: Buffer | null,
    tenantDatabase?: string,
  ): Promise<void> {
    const repo = await this.getRepository(tenantDatabase);
    await repo.update(
      { compRespIdSunat, comprobante: { comprobanteId } },
      { cdr },
    );
  }

  async findByComprobanteId(comprobanteId: number) {
    const repo = await this.getRepository();
    return repo.findOne({ where: { comprobante: { comprobanteId } } });
  }
  async deleteByComprobanteId(comprobanteId: number) {
    const repo = await this.getRepository();
    await repo.delete({ comprobante: { comprobanteId } });
  }
  async dowloadXmlFirmado(
    sucursalId: number,
    comprobanteId: number,
  ): Promise<ArchivoDescargable | null> {
    const repo = await this.getRepository();
    const cpe = await repo.findOne({
      where: { comprobante: { comprobanteId, sucursalId } },
    });
    if (!cpe?.xmlFirmado) {
      throw new BusinessLogicException(
        `No se encontró el archivo XML del comprobante consultado.`,
      );
    }
    return {
      fileName: `${cpe?.hashCpe || 'comprobante'}-${cpe?.comprobanteId}.xml`,
      mimeType: 'application/xml',
      content: Buffer.from(cpe?.xmlFirmado, 'utf-8'),
    };
  }
  async dowloadCdrZip(
    sucursalId: number,
    comprobanteId: number,
  ): Promise<ArchivoDescargable | null> {
    const repo = await this.getRepository();
    const cpe = await repo.findOne({
      where: { comprobante: { comprobanteId, sucursalId } },
    });
    if (!cpe?.cdr) {
      throw new BusinessLogicException(
        `No se encontró el archivo cdr del comprobante consultado.`,
      );
    }
    return {
      fileName: `R-${cpe.hashCpe || 'comprobante'}-${cpe.comprobanteId}.zip`,
      mimeType: 'application/zip',
      content: Buffer.from(cpe.cdr, 'base64'),
    };
  }
}
