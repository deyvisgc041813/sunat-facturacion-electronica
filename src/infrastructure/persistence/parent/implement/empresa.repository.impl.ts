import { CreateEmpresaCredencialesDto } from 'src/domain/parent/empresa/dto/create.credenciales-sunat.request.dto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { EmpresaMapper } from 'src/domain/mapper/empresa.mapper';
import {
  EEstadosGlobales,
  EstadoCredencialEmpresaSunat,
} from 'src/util/estado.enum';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { IEmpresaRepositoryPort } from 'src/domain/parent/empresa/ports/empresa.repository.port';
import { EmpresaResponseDto } from 'src/domain/parent/empresa/dto/external.response.dto';
import { CreateEmpresaDto } from 'src/domain/parent/empresa/dto/create.request.dto';
import { UpdateEmpresaDto } from 'src/domain/parent/empresa/dto/update.request';
import { GetCertificadoDto } from 'src/domain/parent/empresa/dto/obtner-certificado.dto';
import { BusinessLogicException } from 'src/adapter/web/exception/exeception-dynamic';
import { EmpresaOrmEntity } from '../entity/empresa/empesa.orm.entity';
import { EmpresaCredencialesSunatRepositoryImpl } from './empresa.credenciales.repository.impl';
import { UpdateEmpresaCredencialesDto } from 'src/domain/parent/empresa/dto/update.credenciales-sunat.request.dto';

@Injectable()
export class EmpresaRepositoryImpl implements IEmpresaRepositoryPort {
  constructor(
    @InjectRepository(EmpresaOrmEntity)
    private readonly repo: Repository<EmpresaOrmEntity>,
    private readonly credencialRepo: EmpresaCredencialesSunatRepositoryImpl,
    private readonly dataSource: DataSource,
  ) {}

  async save(
    empresa: CreateEmpresaDto,
    credenciales: CreateEmpresaCredencialesDto,
  ): Promise<GenericResponse<{empresaId:number, crencialId:number}>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {

      const empresaRepo = queryRunner.manager.getRepository(EmpresaOrmEntity);
      const newEmpresa = await empresaRepo.save(
        EmpresaMapper.dtoToOrmCreate(empresa),
      );

      credenciales.empresaId = newEmpresa.empresaId;
      const credencialId = await this.credencialRepo.save(credenciales, queryRunner.manager );
      await queryRunner.commitTransaction();
      return {
        status: true,
        message: 'La empresa se registró correctamente.',
        data: {
          empresaId: newEmpresa.empresaId,
          crencialId: credencialId
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error al registrar empresa:', error);
      throw error
    } finally {
      await queryRunner.release();
    }
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
        'credenciales',
      ],
    });
    return result.map((empresa) => EmpresaMapper.toDomain(empresa, true));
  }

  async findById(
    id: number,
    interno: false,
  ): Promise<EmpresaResponseDto | null> {
    const empresa = await this.repo.findOne({
      where: { empresaId: id, estado: EEstadosGlobales.ACTIVO },
      relations: [
        'sucursales',
        'sucursales.distrito',
        'sucursales.distrito.provincia',
        'sucursales.distrito.provincia.departamento',
        'credenciales',
      ],
    });
    if (!empresa) {
      throw new BusinessLogicException(`Empresa con id ${id} no encontrado`);
    }
    return EmpresaMapper.toDomain(empresa, interno);
  }
  async findByRuc(
    ruc: string,
    interno: false,
  ): Promise<EmpresaResponseDto | null> {
    const empresa = await this.repo.findOne({
      where: { ruc, estado: EEstadosGlobales.ACTIVO },
      relations: [
        'sucursales',
        'sucursales.distrito',
        'sucursales.distrito.provincia',
        'sucursales.distrito.provincia.departamento',
        'credenciales',
      ],
    });
    if (!empresa) {
      throw new BusinessLogicException(`Empresa con ruc ${ruc} se encontro`);
    }
    return EmpresaMapper.toDomain(empresa, interno);
  }
  async findCertificado(ruc: string): Promise<GetCertificadoDto | null> {
    const empresa = await this.repo.findOne({
      where: {
        ruc,
        estado: EEstadosGlobales.ACTIVO,
        credenciales: { estado: EstadoCredencialEmpresaSunat.VIGENTE },
      },
    });

    if (!empresa) {
      throw new BusinessLogicException(`No se encontró empresa con RUC ${ruc}`);
    }
    if (!empresa.credenciales[0].certificadoDigital) {
      throw new BusinessLogicException(
        `La empresa ${ruc} no tiene certificado digital registrado`,
      );
    }
    const credenciales = empresa.credenciales[0];
    const certificado = new GetCertificadoDto(
      credenciales.certificadoDigital,
      credenciales.claveCertificado ?? '',
      credenciales.usuarioSolSecundario ?? '',
      credenciales.claveSolSecundario ?? '',
      empresa.email,
      empresa.telefono,
      '',
      '',
      '',
    );
    return certificado;
  }
  async update(
    empresaId: number,
    credencialId:number,
    empresa: UpdateEmpresaDto,
    credenciales: UpdateEmpresaCredencialesDto,
  ): Promise<{ status: boolean; message: string; data?: EmpresaResponseDto }> {
        const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      
      const empresaRepo = queryRunner.manager.getRepository(EmpresaOrmEntity);
      await empresaRepo.update(empresaId, EmpresaMapper.dtoToOrmUpdate(empresa));
      await this.credencialRepo.updateWithManager(credencialId, credenciales, queryRunner.manager );
      await queryRunner.commitTransaction();
      return {
        status: true,
         message: 'La empresa se actualizó correctamente.',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error al actualizar empresa:', error);
      throw error
    } finally {
      await queryRunner.release();
    }
  }
  async updateStatus(
    empresaId: number,
    nuevoEstado: string,
  ): Promise<GenericResponse<void>> {
    const empresa = await this.repo.findOne({
      where: { empresaId },
    });

    if (!empresa) {
      throw new BusinessLogicException(
        `La empresa con ID ${empresaId} no existe.`,
      );
    }
    await this.repo.update(empresaId, { estado: nuevoEstado });
    return {
      status: true,
      message: 'El estado se actualizó correctamente.',
    };
  }
  async deleteById(empresaId: number): Promise<void> {
    try {
      await this.repo.delete({ empresaId });
    } catch (error: any) {
      throw error;
    }
  }
}
