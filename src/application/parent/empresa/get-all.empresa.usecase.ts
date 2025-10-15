import { EmpresaResponseDto } from "src/domain/parent/empresa/dto/external.response.dto";
import { EmpresaService } from "src/domain/parent/empresa/services/empresa.service";


export class GetAllEmpresaUseCase {
  constructor(private readonly empresaService: EmpresaService) {}

  async execute(): Promise<EmpresaResponseDto[]> {
    return this.empresaService.getAll();
  }
}
