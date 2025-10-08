import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EmpresaMapper } from 'src/domain/mapper/empresa.mapper';
import { CreateEmpresaDto } from 'src/domain/empresa/dto/create.request.dto';
import { EmpresaOrmEntity } from './empesa.orm.entity';
import { EmpresaResponseDto } from 'src/domain/empresa/dto/external.response.dto';
import { UpdateEmpresaDto } from 'src/domain/empresa/dto/update.request';
import { GetCertificadoDto } from 'src/domain/empresa/dto/obtner-certificado.dto';
import { EEstadosGlobales } from 'src/util/estado.enum';
import { EmpresaInternaResponseDto } from 'src/domain/empresa/dto/internal.response.dto';
import { IEmpresaRepositoryPort } from 'src/domain/empresa/ports/empresa.repository.port';
import { GenericResponse } from 'src/adapter/web/response/response.interface';

@Injectable()
export class EmpresaRepositoryImpl implements IEmpresaRepositoryPort {
  constructor(
    @InjectRepository(EmpresaOrmEntity)
    private readonly repo: Repository<EmpresaOrmEntity>,
  ) {}

  async save(
    empresa: CreateEmpresaDto,
  ): Promise<{ status: boolean; message: string; data?: EmpresaResponseDto }> {
    const newEmpresa = await this.repo.save(
      EmpresaMapper.dtoToOrmCreate(empresa),
    );
    return {
      status: true,
      message: 'La empresa se registró correctamente.',
      data: EmpresaMapper.toDomain(newEmpresa),
    };
  }

  async findAll(): Promise<EmpresaResponseDto[]> {
    const result = await this.repo.find({
      where: {
        estado: In([EEstadosGlobales.ACTIVO, EEstadosGlobales.INACTIVO]),
      },
      relations: [
        'sucursales',
        'sucursales.distrito',
        'sucursales.distrito.provincia',
        'sucursales.distrito.provincia.departamento',
      ],
    });
    return result.map((empresa) => EmpresaMapper.toDomain(empresa));
  }

  async findById(
    id: number,
    interno: false,
  ): Promise<EmpresaResponseDto | EmpresaInternaResponseDto | null> {
    const empresa = await this.repo.findOne({
      where: { empresaId: id, estado: EEstadosGlobales.ACTIVO },
      relations: [
        'sucursales',
        'sucursales.distrito',
        'sucursales.distrito.provincia',
        'sucursales.distrito.provincia.departamento',
      ],
    });
    if (!empresa) {
      throw new NotFoundException(`Empresa con id ${id} no encontrado`);
    }
    return !interno
      ? EmpresaMapper.toDomain(empresa)
      : EmpresaMapper.toDomainInterno(empresa);
  }
  async findCertificado(ruc: string): Promise<GetCertificadoDto | null> {
    const empresa = await this.repo.findOne({
      where: { ruc, estado: EEstadosGlobales.ACTIVO },
    });

    if (!empresa) {
      throw new NotFoundException(`No se encontró empresa con RUC ${ruc}`);
    }
    if (!empresa.certificadoDigital) {
      throw new NotFoundException(
        `La empresa ${ruc} no tiene certificado digital registrado`,
      );
    }
    const certificado = new GetCertificadoDto(
      empresa.certificadoDigital,
      empresa.claveCertificado ?? '',
      empresa.usuarioSolSecundario ?? '',
      empresa.claveSolSecundario ?? '',
      empresa.email,
      empresa.telefono,
    );
    return certificado;
  }

  async update(
    empresaId: number,
    empresa: UpdateEmpresaDto,
  ): Promise<{ status: boolean; message: string; data?: EmpresaResponseDto }> {
    const empresaUpdate = EmpresaMapper.dtoToOrmUpdate(empresa);
    await this.repo.update(empresaId, empresaUpdate);
    return {
      status: true,
      message: 'La empresa se actualizó correctamente.',
    };
  }
  async updateStatus(
    empresaId: number,
    nuevoEstado: string,
  ): Promise<GenericResponse<void>> {
    const empresa = await this.repo.findOne({
      where: { empresaId },
    });

    if (!empresa) {
      throw new NotFoundException(`La empresa con ID ${empresaId} no existe.`);
    }
    await this.repo.update(empresaId, { estado: nuevoEstado });
    return {
      status: true,
      message: 'El estado se actualizó correctamente.',
    };
  }
}
