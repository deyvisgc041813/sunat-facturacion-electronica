import { Injectable } from '@nestjs/common';
import { ResumenBPMaper } from 'src/domain/mapper/resumen-bp.mapper';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { ResumenBoletasOrmEntity } from '../entity/resumen/resumen-bp.orm.entity';
import { IResumenRepository } from 'src/domain/tenant/resumen/port/resumen.repository.interface';
import { CreateResumenBoletaDto } from 'src/domain/tenant/resumen/interface/create.summary.interface';
import { ResumenResponseDto } from 'src/domain/tenant/resumen/dto/resumen.response.dto';
import { TenantRepositoryHelper } from 'src/domain/parent/conecciones-database/service/tenant-repository.helper';
import { TenantContextService } from 'src/domain/parent/conecciones-database/service/tenant-context.service';
import { BaseTenantRepository } from '../../base/base-tenant.repository';
import dayjs from 'dayjs';

@Injectable()
export class ResumenRepositoryImpl extends BaseTenantRepository<ResumenBoletasOrmEntity> implements IResumenRepository {
    constructor(
      tenantRepositoryHelper: TenantRepositoryHelper,
      tenantContext: TenantContextService,
    ) {
      super(tenantContext, tenantRepositoryHelper, ResumenBoletasOrmEntity);
    }
  async save(
    resumen: CreateResumenBoletaDto,
  ): Promise<GenericResponse<number>> {
    const repo = await this.getRepository();
    const data = ResumenBPMaper.dtoToOrmCreate(resumen);
    const newResumen = await repo.save(data);
    return {
      status: true,
      message: 'Resumen registrado correctamente',
      data: ResumenBPMaper.toDomain(newResumen).resBolId,
    };
  }
  findById(sucursalId:number, id: number): Promise<ResumenResponseDto | null> {
    throw new Error('Method not implemented.');
  }
  findByFecha(sucursalId: number, fecha: string): Promise<ResumenResponseDto[]> {
    throw new Error('Method not implemented.');
  }
  async getNextCorrelativo(sucursalId: number): Promise<number> {
    const repo = await this.getRepository();
    const result = await repo
      .createQueryBuilder('resumen')
      .select('MAX(resumen.correlativo)', 'max')
      .where('resumen.sucursal_id = :sucursalId', { sucursalId })
      // .getRawOne<{ max: number }>();
      .getRawOne() as { max: number | null };
    return result?.max ? Number(result.max) + 1 : 1;
  }
  async update(
    resumenId: string | '',
    sucursalId: number,
    data: Partial<CreateResumenBoletaDto>,
  ): Promise<void> {
    const repo = await this.getRepository();
    data.fechaRespuestaSunat = dayjs().toDate() 
    await repo.update({ resumenId, sucursalId }, data);
  }
  async updateBySucursalAndTicket(sucursalId:number, ticket: string, data: any) {
    const repo = await this.getRepository();
    await repo
      .createQueryBuilder()
      .update()
      .set(data)
      .where('ticket = :ticket', { ticket })
      .andWhere('sucursal_id = :sucursalId', { sucursalId })
      .execute();
  }
  async findBySucursalAndTicket(sucursalId: number, ticket: string): Promise<ResumenResponseDto | null> {
    const repo = await this.getRepository();
    const resumen = await repo.findOne({ where: { ticket, sucursalId }, relations: ['detalles', 'detalles.comprobante']});
    return resumen ? ResumenBPMaper.toDomain(resumen) : null;
  }
}