import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { BusinessLogicException } from 'src/adapter/web/exception/exeception-dynamic';
import { ICredencialesSunatEmpresaRepositoryPort } from 'src/domain/parent/empresa/ports/credenciales-sunat-empresa.repository.port';
import { EmpresaCredencialesOrmEntity } from '../entity/empresa/empesa-credenciales-sunat.orm.entity';
import {
  EmpresaCredencialesInternaResponseDto,
  EmpresaCredencialesResponseDto,
} from 'src/domain/parent/empresa/dto/credenciales-sunat.response.dto';
import { EmpresaCredencialesMapper } from 'src/domain/mapper/empresa-credenciales-sunat.mapper';
import { CreateEmpresaCredencialesDto } from 'src/domain/parent/empresa/dto/create.credenciales-sunat.request.dto';
import { UpdateEmpresaCredencialesDto } from 'src/domain/parent/empresa/dto/update.credenciales-sunat.request.dto';

@Injectable()
export class EmpresaCredencialesSunatRepositoryImpl
  implements ICredencialesSunatEmpresaRepositoryPort
{
  constructor(
    @InjectRepository(EmpresaCredencialesOrmEntity)
    private readonly repo: Repository<EmpresaCredencialesOrmEntity>,
  ) {}

  /**
   * Guarda credenciales dentro de una transacción activa (rollback si falla)
   * @param dto Datos de credenciales SUNAT
   * @param manager EntityManager proveniente del queryRunner
   */
  async save(
    dto: CreateEmpresaCredencialesDto,
    manager: EntityManager,
  ): Promise<number> {
    const entity = EmpresaCredencialesMapper.dtoToOrmCreate(dto);
    const newCredencial = await manager.save(EmpresaCredencialesOrmEntity, entity);
    return EmpresaCredencialesMapper.toDomain(newCredencial)?.credId
  }

  async getAll(): Promise<EmpresaCredencialesResponseDto[]> {
    const result = await this.repo.find({});
    return result.map((credenciales) =>
      EmpresaCredencialesMapper.toDomain(credenciales),
    );
  }

  async findByIdExterna(
    credId: number,
  ): Promise<EmpresaCredencialesResponseDto | null> {
    const credencial = await this.repo.findOne({
      where: { credId },
    });
    if (!credencial) {
      throw new BusinessLogicException(
        `Credenciales con id ${credId} no encontrado`,
      );
    }
    return EmpresaCredencialesMapper.toDomain(credencial);
  }
  async findByIdInterna(
    credId: number,
  ): Promise<EmpresaCredencialesInternaResponseDto> {
    const credencial = await this.repo.findOne({
      where: { credId },
    });
    if (!credencial) {
      throw new BusinessLogicException(
        `Credenciales con id ${credId} no encontrado`,
      );
    }
    return EmpresaCredencialesMapper.toDomainInterno(credencial);
  }
  async update(
    credencialId: number,
    credencial: UpdateEmpresaCredencialesDto,
  ): Promise<void> {
    const empresaUpdate = EmpresaCredencialesMapper.dtoToOrmUpdate(credencial);
    await this.repo.update(credencialId, empresaUpdate);
  }
  async updateWithManager(
    credencialId: number,
    credencial: UpdateEmpresaCredencialesDto,
    manager: EntityManager,
  ): Promise<void> {
    const credencialUpdate =
      EmpresaCredencialesMapper.dtoToOrmUpdate(credencial);
    await manager.update(
      EmpresaCredencialesOrmEntity,
      { credId: credencialId },
      credencialUpdate,
    );
  }

  async updateStatus(
    credId: number,
    nuevoEstado: string,
  ): Promise<GenericResponse<void>> {
    const empresa = await this.repo.findOne({
      where: { credId },
    });

    if (!empresa) {
      throw new BusinessLogicException(
        `La credencial con ID ${credId} no existe.`,
      );
    }
    await this.repo.update(credId, { estado: nuevoEstado });
    return {
      status: true,
      message: 'El estado se actualizó correctamente.',
    };
  }
  async deleteById(credId: number): Promise<void> {
    try {
      await this.repo.delete({ credId });
    } catch (error: any) {
      throw error;
    }
  }
}
