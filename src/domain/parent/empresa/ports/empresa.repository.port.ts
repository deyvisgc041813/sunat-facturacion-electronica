import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { CreateEmpresaDto } from '../dto/create.request.dto';
import { EmpresaResponseDto } from '../dto/external.response.dto';
import { GetCertificadoDto } from '../dto/obtner-certificado.dto';
import { UpdateEmpresaDto } from '../dto/update.request';
import { CreateEmpresaCredencialesDto } from '../dto/create.credenciales-sunat.request.dto';
import { UpdateEmpresaCredencialesDto } from '../dto/update.credenciales-sunat.request.dto';

export interface IEmpresaRepositoryPort {
  save(
    empresa: CreateEmpresaDto,
    credenciales: CreateEmpresaCredencialesDto,
  ): Promise<GenericResponse<{empresaId:number, crencialId:number}>>;
  findAll(): Promise<EmpresaResponseDto[]>;
  findById(
    id: number,
    interno: boolean,
  ): Promise<EmpresaResponseDto | null>;
  findCertificado(ruc: string): Promise<GetCertificadoDto | null>;
  update(
    empresaId: number,
    credencialId: number,
    empresa: UpdateEmpresaDto,
    credenciales: UpdateEmpresaCredencialesDto,
  ): Promise<{ status: boolean; message: string; data?: EmpresaResponseDto }>;
  updateStatus(
    empresaId: number,
    nuevoEstado: string,
  ): Promise<GenericResponse<void>>;
  deleteById(empresaId: number): Promise<void>;
}
