import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { CreateEmpresaDto } from '../dto/create.request.dto';
import { EmpresaResponseDto } from '../dto/external.response.dto';
import { EmpresaInternaResponseDto } from '../dto/internal.response.dto';
import { GetCertificadoDto } from '../dto/obtner-certificado.dto';
import { UpdateEmpresaDto } from '../dto/update.request';

export interface IEmpresaRepositoryPort {
  save(
    empresa: CreateEmpresaDto,
    
  ): Promise<{ status: boolean; message: string; data?: EmpresaResponseDto }>;
  findAll(): Promise<EmpresaResponseDto[]>;
  findById(
    id: number,
    interno: boolean,
  ): Promise<EmpresaResponseDto | EmpresaInternaResponseDto | null>;
  findCertificado(ruc: string): Promise<GetCertificadoDto | null>;
  update(
    empresaId: number,
    empresa: UpdateEmpresaDto,
  ): Promise<{ status: boolean; message: string; data?: EmpresaResponseDto }>;
  updateStatus(
    empresaId: number,
    nuevoEstado: string
  ): Promise<GenericResponse<void>>;
  deleteById(
    empresaId: number,
  ): Promise<void>
}
