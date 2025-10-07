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
import { UpdateSucursalDto } from 'src/domain/sucursal/dto/update.request.dto';

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
    let resp = SucursalMapper.toDomain(newSucursal);
    delete resp.empresa;
    delete resp.ubicacionGeografica;
    return {
      status: true,
      message: 'La sucursal se registró correctamente.',
      data: resp,
    };
  }

  async getSucursalesByEmpresa(
    empresaId: number,
  ): Promise<SucursalResponseDto[]> {
    const result = await this.repo.find({
      where: {
        empresa: { empresaId },
        estado: In([EstadoSystem.ACTIVO, EstadoSystem.INACTIVO]),
      },
      relations: [
        'empresa',
        'series',
        'distrito',
        'distrito.provincia',
        'distrito.provincia.departamento',
      ],
    });
    if (!result)
      throw new NotFoundException('No se encontro sucursales para esta sesion');
    return result.map((sucursal) => SucursalMapper.toDomain(sucursal));
  }
  async getByIdSucursal(
    sucursalesId: number,
    empresaId: number,
  ): Promise<SucursalResponseDto | null> {
    const sucursales = await this.repo.findOne({
      where: {
        sucursalId: sucursalesId,
        empresa: { empresaId },
        estado: In([EstadoSystem.ACTIVO, EstadoSystem.INACTIVO]),
      },
      relations: [
        'empresa',
        'series',
        'distrito',
        'distrito.provincia',
        'distrito.provincia.departamento',
      ],
    });
    if (!sucursales) return null;
    return SucursalMapper.toDomain(sucursales);
  }
  async getByIds(
    sucursalesIds: number[],
    empresaId: number,
  ): Promise<SucursalResponseDto[]> {
    const sucursales = await this.repo.find({
      where: {
        sucursalId: In(sucursalesIds),
        estado: EstadoSystem.ACTIVO,
        empresa: { empresaId },
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
    sucursalId: number,
    empresaId: number,
    sucursal: UpdateSucursalDto,
  ): Promise<GenericResponse<SucursalResponseDto>> {
    await this.repo.update(
      { sucursalId, empresa: { empresaId } },
      SucursalMapper.dtoToOrmUpdate(sucursal, sucursalId),
    );
    return {
      status: true,
      message: 'La sucursal se actualizó correctamente.',
    };
  }
  async generateBranchCodeByCompany(empresaId: number): Promise<string> {
    const total = await this.repo.countBy({ empresa: { empresaId } });
    const nextNumber = total + 1;
    const code = `EMP${String(empresaId).padStart(3, '0')}-SUC${String(nextNumber).padStart(3, '0')}`;
    return code;
  }
  async updateBranchStatus(
    sucursalId: number,
    nuevoEstado: number,
    usuarioModificacion: string,
  ): Promise<GenericResponse<void>> {
    const sucursal = await this.repo.findOne({
      where: { sucursalId },
    });

    if (!sucursal) {
      throw new Error(`Sucursal con ID ${sucursalId} no encontrada`);
    }
    await this.repo.update(sucursalId, {
      estado: nuevoEstado,
      usuarioModificacion,
      fechaModificacion: new Date(),
    });
    return {
      status: true,
      message: 'La sucursal se elimino correctamente.',
    };
  }
}
