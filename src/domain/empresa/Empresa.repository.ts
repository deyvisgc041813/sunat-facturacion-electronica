import { CreateEmpresaDto } from './dto/CreateEmpresaDto';
import { EmpresaInternaResponseDto } from './dto/EmpresaInternaResponseDto';
import { EmpresaResponseDto } from './dto/EmpresaResponseDto';
import { GetCertificadoDto } from './dto/GetCertificadoDto';
import { UpdateEmpresaDto } from './dto/UpdateEmpresaDto';

export interface EmpresaRepository {
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
}
