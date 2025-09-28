import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { BajaComprobanteOrmEntity } from './BajaComprobanteOrmEntity';
import { IComunicacionBajaRepository } from 'src/domain/comunicacion-baja/interface/baja.repository.interface';
import { BajaComprobanteResponseDto } from 'src/domain/comunicacion-baja/ComunicacionBajaResponseDto';
import { ComunicacionBajaMaper } from 'src/domain/mapper/ComunicacionBajaMaper';
import { CreateComunicacionBajaDto } from 'src/domain/comunicacion-baja/interface/create.comunicacion.interface';

@Injectable()
export class ComunicacionBajaRepositoryImpl
  implements IComunicacionBajaRepository
{
  constructor(
    @InjectRepository(BajaComprobanteOrmEntity)
    private readonly repo: Repository<BajaComprobanteOrmEntity>,
  ) {}

  async save(
    resumen: CreateComunicacionBajaDto,
  ): Promise<GenericResponse<number>> {
    const data = ComunicacionBajaMaper.dtoToOrmCreate(resumen);
    const newBaja = await this.repo.save(data);
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
  findByFecha(
    sucursalId: number,
    fecha: string,
  ): Promise<BajaComprobanteResponseDto[]> {
    throw new Error('Method not implemented.');
  }
  async getNextCorrelativo(sucursalId: number): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('baja')
      .select('MAX(baja.correlativo)', 'max')
      .where('baja.sucursal = :sucursalId', { sucursalId })
      .getRawOne<{ max: number }>();
    return result?.max ? Number(result.max) + 1 : 1;
  }
  async update(
    serie: string | '',
    sucursalId: number,
    data: Partial<CreateComunicacionBajaDto>,
  ): Promise<void> {
    await this.repo.update({ serie: serie, sucursal: { sucursalId } }, data);
  }
  async updateBySucursalAndTicket(sucursalId: number, ticket: string, data: any) {
    await this.repo
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
    const resumen = await this.repo.findOne({
      where: { ticket, sucursal: {sucursalId} },
      relations: ['sucursal', 'detalles', 'detalles.comprobante'],
    });
    return resumen ? ComunicacionBajaMaper.toDomain(resumen) : null;
  }
}
