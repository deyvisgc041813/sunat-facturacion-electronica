import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IResumenRepository } from 'src/domain/resumen/interface/resumen.repository.interface';
import { ResumenResponseDto } from 'src/domain/resumen/dto/ResumenResponseDto';
import { ResumenBoletasOrmEntity } from './ResumenBoletasOrmEntity';
import { ResumenBPMaper } from 'src/domain/mapper/ResumenBPMaper';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { CreateResumenBoletaDto } from 'src/domain/resumen/interface/create.summary.interface';

@Injectable()
export class ResumenRepositoryImpl implements IResumenRepository {
  constructor(
    @InjectRepository(ResumenBoletasOrmEntity)
    private readonly repo: Repository<ResumenBoletasOrmEntity>,
  ) {}

  async save(
    resumen: CreateResumenBoletaDto,
  ): Promise<GenericResponse<number>> {
    const data = ResumenBPMaper.dtoToOrmCreate(resumen);
    const newResumen = await this.repo.save(data);
    return {
      status: true,
      message: 'Resumen registrado correctamente',
      data: ResumenBPMaper.toDomain(newResumen).resBolId,
    };
  }
  findByEmpresaAndId(empresaId:number, id: number): Promise<ResumenResponseDto | null> {
    throw new Error('Method not implemented.');
  }
  findByFecha(empresaId: number, fecha: string): Promise<ResumenResponseDto[]> {
    throw new Error('Method not implemented.');
  }
  async getNextCorrelativo(empresaId: number): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('resumen')
      .select('MAX(resumen.correlativo)', 'max')
      .where('resumen.empresa = :empresaId', { empresaId })
      .getRawOne<{ max: number }>();
    return result?.max ? Number(result.max) + 1 : 1;
  }
  async update(
    resumenId: string | '',
    empresaId: number,
    data: Partial<CreateResumenBoletaDto>,
  ): Promise<void> {
    await this.repo.update({ resumenId: resumenId, empresa: {empresaId} }, data);
  }
  async updateByEmpresaAndTicket(empresaId:number, ticket: string, data: any) {
    await this.repo
      .createQueryBuilder()
      .update()
      .set(data)
      .where('ticket = :ticket', { ticket })
      .andWhere('empresa_id = :empresaId', { empresaId })
      .execute();
  }
  async findByEmpresaAndTicket(empresaId: number, ticket: string): Promise<ResumenResponseDto | null> {
    const resumen = await this.repo.findOne({ where: { ticket, empresa: {empresaId} }, relations: ['empresa', 'detalles', 'detalles.comprobante']});
    return resumen ? ResumenBPMaper.toDomain(resumen) : null;
  }
}