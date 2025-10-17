import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EEstadosGlobales } from 'src/util/estado.enum';
import { SucursalMapper } from 'src/domain/mapper/sucursal.mapper';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { SucursalOrmEntity } from '../entity/sucursal.orm.entity';
import { ISucursalRepository } from 'src/domain/parent/sucursal/ports/sucursal.repository';
import { SucursalResponseDto } from 'src/domain/parent/sucursal/dto/sucursal.response.dto';
import { CreateSucursalDto } from 'src/domain/parent/sucursal/dto/create.request.dto';
import { UpdateSucursalDto } from 'src/domain/parent/sucursal/dto/update.request.dto';
const estadosVisibles = [
  EEstadosGlobales.ACTIVO,
  EEstadosGlobales.INACTIVO,
  EEstadosGlobales.HABILITADA_FACTURACION,
  EEstadosGlobales.PENDIENTE_ACTIVACION,
];

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
        estado: In(estadosVisibles),
      },
      relations: [
        'empresa',
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
    sucursalId: number,
    empresaId: number,
  ): Promise<SucursalResponseDto | null> {
    const sucursales = await this.repo.findOne({
      where: {
        sucursalId,
        empresa: { empresaId },
        estado: In(estadosVisibles),
      },
      relations: [
        'empresa',
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
        estado: In(estadosVisibles),
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
        estado: EEstadosGlobales.HABILITADA_FACTURACION,
      },
      relations: ['empresa'],
    });
    if (!sucursal) {
      throw new NotFoundException(
        'La sucursal actual no se encuentra activa para emitir comprobantes de venta. Verifique el estado o comuníquese con el administrador del sistema.',
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
    nuevoEstado: string,
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
      message: 'El estado se actualizó correctamente.',
    };
  }
  async getSucursalByStatus(
    empresaId: number,
    sucursalesId: number,
    estado: EEstadosGlobales,
  ): Promise<SucursalResponseDto | null> {
    const sucursal = await this.repo.findOne({
      where: {
        sucursalId: sucursalesId,
        estado: estado,
        empresa: { empresaId },
      },
      relations: [
        'empresa',
        'distrito',
        'distrito.provincia',
        'distrito.provincia.departamento',
      ],
    });
    if (!sucursal) return null;
    return SucursalMapper.toDomain(sucursal);
  }
  async deleteById(sucursalId: number, empresaId: number): Promise<void> {
    await this.repo.delete({
      sucursalId: sucursalId,
      empresa: { empresaId: empresaId },
    });
  }
}
