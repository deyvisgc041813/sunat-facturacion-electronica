import { Injectable, NotFoundException } from '@nestjs/common';
import { SerieAuditoriaOrmEntity } from '../../entity/serie-comprobante/serie-auditoria.orm.entity';
import { SerieAuditoriaMapper } from 'src/domain/mapper/serie-auditoria.mapper';
import { SerieAuditoriaRepository } from 'src/domain/tenant/series-auditoria/port/serie-auditoria.repository.port';
import { SerieAuditoriaResponseDto } from 'src/domain/tenant/series-auditoria/dto/serie-auditoria.response.dto';
import { CreateSerieAuditoriaDto } from 'src/domain/tenant/series-auditoria/dto/create.serie-auditoria.dto';
import { UpdateSerieDto } from 'src/domain/tenant/serie-comprobante/dto/update.request.dto';
import { TenantRepositoryHelper } from 'src/domain/parent/conecciones-database/service/tenant-repository.helper';
import { TenantContextService } from 'src/domain/parent/conecciones-database/service/tenant-context.service';
import { BaseTenantRepository } from 'src/infrastructure/persistence/base/base-tenant.repository';

@Injectable()
export class SerieAuditoriaRepositoryImpl extends BaseTenantRepository<SerieAuditoriaOrmEntity>  implements SerieAuditoriaRepository {
 constructor(
    tenantRepositoryHelper: TenantRepositoryHelper,
    tenantContext: TenantContextService,
  ) {
    super(tenantContext, tenantRepositoryHelper, SerieAuditoriaOrmEntity);
  }

  async save(serie: CreateSerieAuditoriaDto): Promise<{ status: boolean; message: string; data?: SerieAuditoriaResponseDto }> {
    const repo = await this.getRepository();
    const create = await repo.save(serie);
    return {
      status: true,
      message: 'log registrado correctamente',
      data: SerieAuditoriaMapper.toDomain(create),
    };
  }

  async findAll(): Promise<SerieAuditoriaResponseDto[]> {
    const repo = await this.getRepository();
    const result = await repo.find({
      relations: ['serie'],
    });
    return result.map((s) => SerieAuditoriaMapper.toDomain(s));
  }

  async findById(serieId: number): Promise<SerieAuditoriaResponseDto | null> {
    const repo = await this.getRepository();
    const serie = await repo.findOne({
      where: { serie: {serieId} },
      relations: ['serie'],
    });
    if (!serie) {
      throw new NotFoundException(`Log con id ${serieId} no encontrado`);
    }
    return SerieAuditoriaMapper.toDomain(serie)
  }
  async update(serie: UpdateSerieDto, serieId:number): Promise<{ status: boolean; message: string; data?: SerieAuditoriaResponseDto }> {
    const repo = await this.getRepository();
    await repo.update(serieId, SerieAuditoriaMapper.dtoToOrmUpdate(serie));
    return {
      status: true,
      message: 'Actualizado correctamente'
    };
  }
}
