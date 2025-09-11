import { CreateEmpresaDto } from "./dto/CreateEmpresaDto";
import { EmpresaResponseDto } from "./dto/EmpresaResponseDto";
import { UpdateEmpresaDto } from "./dto/UpdateEmpresaDto";

export interface EmpresaRepository {
  save(empresa: CreateEmpresaDto): Promise<{status: boolean, message: string, data?: EmpresaResponseDto}>;
  findAll(): Promise<EmpresaResponseDto[]>;
  findById(id: number): Promise<EmpresaResponseDto | null>;
  update(cliente: UpdateEmpresaDto, empresaId:number): Promise<{status: boolean, message: string, data?: EmpresaResponseDto}> 
}
