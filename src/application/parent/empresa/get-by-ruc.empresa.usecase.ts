import { EmpresaResponseDto } from "src/domain/parent/empresa/dto/external.response.dto";
import { EmpresaService } from "src/domain/parent/empresa/services/empresa.service";


export class GetByRucEmpresaUseCase {
  constructor(private readonly empresaService: EmpresaService) {}

  async execute(ruc: string): Promise<EmpresaResponseDto | null> {
    return this.empresaService.getByRuc(ruc);
  }
}
