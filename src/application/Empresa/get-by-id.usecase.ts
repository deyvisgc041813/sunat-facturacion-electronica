import { EmpresaResponseDto } from "src/domain/empresa/dto/EmpresaResponseDto";
import { EmpresaService } from "src/domain/empresa/services/empresa.service";

export class GetByIdEmpresaUseCase {
  constructor(private readonly empresaService: EmpresaService) {}

  async execute(id: number): Promise<EmpresaResponseDto | null> {
    return this.empresaService.getById(id);
  }
}
