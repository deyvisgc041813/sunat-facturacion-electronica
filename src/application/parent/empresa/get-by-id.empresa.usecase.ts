import { EmpresaResponseDto } from "src/domain/parent/empresa/dto/external.response.dto";
import { EmpresaService } from "src/domain/parent/empresa/services/empresa.service";


export class GetByIdEmpresaUseCase {
  constructor(private readonly empresaService: EmpresaService) {}

  async execute(id: number): Promise<EmpresaResponseDto | null> {
    return this.empresaService.getById(id);
  }
}
