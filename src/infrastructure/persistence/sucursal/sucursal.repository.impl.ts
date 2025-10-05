import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EstadoSystem } from 'src/util/estado.enum';
import { SucursalOrmEntity } from './SucursalOrmEntity';
import { ISucursalRepository } from 'src/domain/sucursal/ports/sucursal.repository';
import { CreateSucursalDto } from 'src/domain/sucursal/dto/create.request.dto';
import { SucursalResponseDto } from 'src/domain/sucursal/dto/sucursal.response.dto';
import { SucursalMapper } from 'src/domain/mapper/SucursalMapper';
import { GenericResponse } from 'src/adapter/web/response/response.interface';

@Injectable()
export class SucursalRepositoryImpl implements ISucursalRepository {
  constructor(
    @InjectRepository(SucursalOrmEntity)
    private readonly repo: Repository<SucursalOrmEntity>,
  ) {}

  async save(
    sucursal: CreateSucursalDto,
  ): Promise<GenericResponse<SucursalResponseDto>> {
    const newSucursal = await this.repo.save(
      SucursalMapper.dtoToCreate(sucursal),
    );
    return {
      status: true,
      message: 'La sucursal se registró correctamente.',
      data: SucursalMapper.toDomain(newSucursal),
    };
  }

  async getSucursalesByEmpresa(empresaId: number): Promise<SucursalResponseDto[]> {
    const result = await this.repo.find({
      where: {
        empresa: { empresaId },
      },
      relations: [
        'empresa',
        'series',
        'distrito',
        'distrito.provincia',
        'distrito.provincia.departamento'
      ],
    });
    if(!result) throw new NotFoundException("No se encontro sucursales para esta sesion")
    return result.map((sucursal) => SucursalMapper.toDomain(sucursal));
  }
  async getByIds(sucursalesIds: number[], empresaId: number): Promise<SucursalResponseDto[]> {
    const sucursales = await this.repo.find({
      where: {
        sucursalId: In(sucursalesIds),
        empresa: {empresaId}
      },
    });
    return sucursales.map((rsp) => SucursalMapper.toDomain(rsp));
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
  ): Promise<GenericResponse<SucursalResponseDto>> {
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
