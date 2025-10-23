import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { CreateEmpresaCredencialesDto } from '../dto/create.credenciales-sunat.request.dto';
import { UpdateEmpresaCredencialesDto } from '../dto/update.credenciales-sunat.request.dto';
import {
  EmpresaCredencialesInternaResponseDto,
  EmpresaCredencialesResponseDto,
} from '../dto/credenciales-sunat.response.dto';
import { EntityManager } from 'typeorm';

export interface ICredencialesSunatEmpresaRepositoryPort {
  save(empresa: CreateEmpresaCredencialesDto, manager: EntityManager): Promise<number>;
  getAll(): Promise<EmpresaCredencialesResponseDto[]>;
  findByIdExterna(
    credId: number,
  ): Promise<EmpresaCredencialesResponseDto | null>;
  findByIdInterna(
    credId: number,
  ): Promise<EmpresaCredencialesInternaResponseDto>;
  update(
    credencialId: number,
    empresa: UpdateEmpresaCredencialesDto,
  ): Promise<void>;
  updateWithManager(
    credencialId: number,
    credencial: UpdateEmpresaCredencialesDto,
    manager: EntityManager,
  ): Promise<void>
  updateStatus(
    credencialId: number,
    nuevoEstado: string,
  ): Promise<GenericResponse<void>>;
  deleteById(credencialId: number): Promise<void>;
}
