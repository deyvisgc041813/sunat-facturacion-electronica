import { Injectable, NotFoundException } from '@nestjs/common';
import { SunatLogMapper } from 'src/domain/mapper/sunat-log.mapper';
import { SunatLogOrmEntity } from '../../entity/sunat-log.orm.entity';
import { SunatLogRepository } from 'src/domain/tenant/sunat-log/port/sunat-log.repository.port';
import { CreateSunatLogDto, SunatLogResponseDto } from 'src/domain/tenant/sunat-log/interface/sunat.log.interface';
import { TenantRepositoryHelper } from 'src/domain/parent/conecciones-database/service/tenant-repository.helper';
import { TenantContextService } from 'src/domain/parent/conecciones-database/service/tenant-context.service';
import { BaseTenantRepository } from 'src/infrastructure/persistence/base/base-tenant.repository';

@Injectable()
export class SunatLogRepositoryImpl extends BaseTenantRepository<SunatLogOrmEntity>  implements SunatLogRepository {
 constructor(
    tenantRepositoryHelper: TenantRepositoryHelper,
    tenantContext: TenantContextService,
  ) {
    super(tenantContext, tenantRepositoryHelper, SunatLogOrmEntity);
  }

  async save(log: CreateSunatLogDto): Promise<{ status: boolean; message: string; data?: SunatLogResponseDto }> {
      const repo = await this.getRepository();
     await repo.save(SunatLogMapper.dtoToOrmCreate(log));
    return {
      status: true,
      message: 'log registrado correctamente',
    };
  }
  async findAll(): Promise<SunatLogResponseDto[]> {
    const repo = await this.getRepository();
    const result = await repo.find({
      relations: ['comprobante'],
    });
    return result.map((s) => SunatLogMapper.toDomain(s));
  }
  async findById(id: number): Promise<SunatLogResponseDto | null> {
    const repo = await this.getRepository();
    const serie = await repo.findOne({
      where: { id: id },
      relations: ['comprobante'],
    });
    if (!serie) {
      throw new NotFoundException(`Log con id ${id} no encontrado`);
    }
    return SunatLogMapper.toDomain(serie)
  }
}
