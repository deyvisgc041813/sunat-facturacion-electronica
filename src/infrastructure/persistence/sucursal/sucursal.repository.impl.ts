import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoSystem } from 'src/util/estado.enum';
import { SucursalOrmEntity } from './SucursalOrmEntity';
import { ISucursalRepository } from 'src/domain/sucursal/sucursal.repository';
import { CreateSucursalDto } from 'src/domain/sucursal/dto/CreateSucursalDto';
import { SucursalResponseDto } from 'src/domain/sucursal/dto/SucursalResponseDto';
import { SucursalMapper } from 'src/domain/mapper/SucursalMapper';

@Injectable()
export class SucursalRepositoryImpl implements ISucursalRepository {
  constructor(
    @InjectRepository(SucursalOrmEntity)
    private readonly repo: Repository<SucursalOrmEntity>,
  ) {}

  async save(
    sucursal: CreateSucursalDto,
  ): Promise<{ status: boolean; message: string; data?: SucursalResponseDto }> {
    const newSucursal = await this.repo.save(
      SucursalMapper.dtoToCreate(sucursal),
    );
    return {
      status: true,
      message: 'Sucursal registrado correctamente',
      data: SucursalMapper.toDomain(newSucursal),
    };
  }

  async findAll(empresaId: number): Promise<SucursalResponseDto[]> {
    const result = await this.repo.find({
      where: {
        empresa: { empresaId },
      },
      relations: ['empresa' , 'series', 'comprobantes', 'resumenes', 'comunicacionBaja', 'sunatLog'],
    });
    return result.map((sucursal) => SucursalMapper.toDomain(sucursal));
  }

  async findSucursalExterna(
    empresaId: number,
    sucursalId: number,
  ): Promise<SucursalResponseDto | null> {
    const sucursal = await this.repo.findOne({
      where: {
        sucursalId,
        empresa: { empresaId },
        estado: EstadoSystem.ACTIVO,
      },
      relations: ['empresa' , 'series', 'comprobantes', 'resumenes', 'comunicacionBaja', 'sunatLog'],
    });
    if (!sucursal) {
      throw new NotFoundException(
        `No se encontró la sucursal con ID ${sucursalId} para la empresa con ID ${empresaId}.`,
      );
    }
    return SucursalMapper.toDomain(sucursal);
  }
  async findSucursalInterna(
    empresaId: number,
    sucursalId: number,
  ): Promise<SucursalResponseDto | null> {
    const sucursal = await this.repo.findOne({
      where: {
        sucursalId,
        empresa: { empresaId },
        estado: EstadoSystem.ACTIVO,
      },
      relations: ['empresa'],
    });
    if (!sucursal) {
      throw new NotFoundException(
        `No se encontró la sucursal con ID ${sucursalId} para la empresa con ID ${empresaId}.`,
      );
    }
    return SucursalMapper.toDomainInterno(sucursal);
  }
  async update(
    sucursal: any,
    sucursalId: number,
  ): Promise<{ status: boolean; message: string; data?: SucursalResponseDto }> {
    const sucursalUpdate = SucursalMapper.dtoToOrmUpdate(sucursal);
    sucursalUpdate.sucursalId = sucursalId;
    const newUpdate = await this.repo.save(sucursalUpdate);
    return {
      status: true,
      message: 'Actualizado correctamente',
      data: SucursalMapper.toDomain(newUpdate),
    };
  }
}
