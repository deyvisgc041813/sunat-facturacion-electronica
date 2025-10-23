import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EmpresaMapper } from 'src/domain/mapper/empresa.mapper';
import { EmpresaOrmEntity } from '../entity/empesa.orm.entity';
import { EEstadosGlobales } from 'src/util/estado.enum';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { IEmpresaRepositoryPort } from 'src/domain/parent/empresa/ports/empresa.repository.port';
import { EmpresaResponseDto } from 'src/domain/parent/empresa/dto/external.response.dto';
import { CreateEmpresaDto } from 'src/domain/parent/empresa/dto/create.request.dto';
import { EmpresaInternaResponseDto } from 'src/domain/parent/empresa/dto/internal.response.dto';
import { UpdateEmpresaDto } from 'src/domain/parent/empresa/dto/update.request';
import { GetCertificadoDto } from 'src/domain/parent/empresa/dto/obtner-certificado.dto';
import { BusinessLogicException } from 'src/adapter/web/exception/exeception-dynamic';

@Injectable()
export class EmpresaRepositoryImpl implements IEmpresaRepositoryPort {
  constructor(
    @InjectRepository(EmpresaOrmEntity)
    private readonly repo: Repository<EmpresaOrmEntity>,
  ) {}

  async save(
    empresa: CreateEmpresaDto,
  ): Promise<GenericResponse<EmpresaResponseDto>> {
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
      throw new BusinessLogicException(`Empresa con id ${id} no encontrado`);
    }
    return !interno
      ? EmpresaMapper.toDomain(empresa)
      : EmpresaMapper.toDomainInterno(empresa);
  }
  async findByRuc(
    ruc: string,
    interno: false,
  ): Promise<EmpresaResponseDto | EmpresaInternaResponseDto | null> {
    const empresa = await this.repo.findOne({
      where: { ruc, estado: EEstadosGlobales.ACTIVO },
      relations: [
        'sucursales',
        'sucursales.distrito',
        'sucursales.distrito.provincia',
        'sucursales.distrito.provincia.departamento',
      ],
    });
    if (!empresa) {
      throw new BusinessLogicException(`Empresa con ruc ${ruc} se encontro`);
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
      throw new BusinessLogicException(`No se encontró empresa con RUC ${ruc}`);
    }
    if (!empresa.certificadoDigital) {
      throw new BusinessLogicException(
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
      "",
      "",
      ""
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
      throw new BusinessLogicException(`La empresa con ID ${empresaId} no existe.`);
    }
    await this.repo.update(empresaId, { estado: nuevoEstado });
    return {
      status: true,
      message: 'El estado se actualizó correctamente.',
    };
  }
  async deleteById(empresaId: number): Promise<void> {
    try {
    await this.repo.delete({empresaId});
    } catch (error: any) {
      throw error;
    }
  }
}
