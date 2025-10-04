import { EmpresaResponseDto } from "src/domain/empresa/dto/EmpresaResponseDto";
import { EmpresaService } from "src/domain/empresa/services/empresa.service";

export class GetAllEmpresaUseCase {
  constructor(private readonly empresaService: EmpresaService) {}

  async execute(): Promise<EmpresaResponseDto[]> {
    return this.empresaService.getAll();
  }
}
