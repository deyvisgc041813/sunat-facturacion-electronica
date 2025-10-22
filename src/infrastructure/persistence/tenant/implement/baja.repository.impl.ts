import { Injectable } from '@nestjs/common';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { ComunicacionBajaMaper } from 'src/domain/mapper/comunicacion-baja.mapper';
import { BajaComprobanteOrmEntity } from '../entity/comunicacion-baja/baja-comprobante.orm.entity';
import { CreateComunicacionBajaDto } from 'src/domain/tenant/comunicacion-baja/interface/create.comunicacion.interface';
import { BajaComprobanteResponseDto } from 'src/domain/tenant/comunicacion-baja/dto/ComunicacionBajaResponseDto';
import { IComunicacionBajaRepository } from 'src/domain/tenant/comunicacion-baja/interface/baja.repository.interface';
import { TenantRepositoryHelper } from 'src/domain/parent/conecciones-database/service/tenant-repository.helper';
import { TenantContextService } from 'src/domain/parent/conecciones-database/service/tenant-context.service';
import { BaseTenantRepository } from '../../base/base-tenant.repository';
import { EstadoEnumComprobante } from 'src/util/estado.enum';
import { Between } from 'typeorm';

@Injectable()
export class ComunicacionBajaRepositoryImpl extends BaseTenantRepository<BajaComprobanteOrmEntity> 
  implements IComunicacionBajaRepository
{
  constructor(
    tenantRepositoryHelper: TenantRepositoryHelper,
    tenantContext: TenantContextService,
  ) {
    super(tenantContext, tenantRepositoryHelper, BajaComprobanteOrmEntity);
  }

  async save(
    resumen: CreateComunicacionBajaDto,
    tenantDatabase?:string
  ): Promise<GenericResponse<number>> {
    const repo = await this.getRepository(tenantDatabase);
    const data = ComunicacionBajaMaper.dtoToOrmCreate(resumen);
    const newBaja = await repo.save(data);
    return {
      status: true,
      message:
        'La solicitud de baja del comprobante ha sido registrada con éxito.',
      data: ComunicacionBajaMaper.toDomain(newBaja)?.bajaComprobanteId,
    };
  }
  findBySucursalAndId(
    sucursalId: number,
    id: number,
  ): Promise<BajaComprobanteResponseDto | null> {
    throw new Error('Method not implemented.');
  }
 async findByFecha(
    sucursalId: number,
    fechaResumen: Date,
    estado: EstadoEnumComprobante,
    tenantDatabase?: string,
  ): Promise<BajaComprobanteResponseDto[]> {
    const repo = await this.getRepository(tenantDatabase);
    const inicioDelDia = new Date(fechaResumen);
    inicioDelDia.setHours(0, 0, 0, 0);
    const finDelDia = new Date(fechaResumen);
    finDelDia.setHours(23, 59, 59, 999);
    const rsp = await repo.find({
      where: {
        sucursalId,
        fechaGeneracion: Between(inicioDelDia, finDelDia),
        estado: estado,
      },
      order: {
        fechaGeneracion: 'ASC',
      },
    });
    return rsp.map(ComunicacionBajaMaper.toDomain);
  }
  async getNextCorrelativo(sucursalId: number): Promise<number> {
    const repo = await this.getRepository();
    const result = await repo
    .createQueryBuilder('baja')
    .select('MAX(baja.correlativo)', 'max')
    .where('baja.sucursal_id = :sucursalId', { sucursalId })
    .getRawOne() as { max: number | null };
    return result?.max ? Number(result.max) + 1 : 1;
  }
  async update(
    serie: string | '',
    sucursalId: number,
    data: Partial<CreateComunicacionBajaDto>,
    tenantDatabase?:string
  ): Promise<void> {
    const repo = await this.getRepository(tenantDatabase);
    await repo.update({ serie: serie, sucursalId }, data);
  }
  async updateBySucursalAndTicket(sucursalId: number, ticket: string, data: any) {
    const repo = await this.getRepository();
    await repo
      .createQueryBuilder()
      .update()
      .set(data)
      .where('ticket = :ticket', { ticket })
      .andWhere('sucursal_id = :sucursalId', { sucursalId })
      .execute();
  }
  async findBySucursalAndTicket(
    sucursalId: number,
    ticket: string,
  ): Promise<BajaComprobanteResponseDto | null> {
    const repo = await this.getRepository();
    const resumen = await repo.findOne({
      where: { ticket, sucursalId},
      relations: ['detalles', 'detalles.comprobante'],
    });
    return resumen ? ComunicacionBajaMaper.toDomain(resumen) : null;
  }
}
