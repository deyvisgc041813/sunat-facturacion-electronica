import { CreateEmpresaDto } from 'src/domain/empresa/dto/CreateEmpresaDto';
import { EmpresaResponseDto } from 'src/domain/empresa/dto/EmpresaResponseDto';
import { EmpresaService } from 'src/domain/empresa/services/empresa.service';
export class CreateEmpresaUseCase {
  constructor(private readonly empresaService: EmpresaService) {}
  async execute(
    data: CreateEmpresaDto,
  ): Promise<{ status: boolean; message: string; data?: EmpresaResponseDto }> {
    return this.empresaService.save(data);
  }
}
