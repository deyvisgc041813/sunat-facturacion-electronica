import { EmpresaResponseDto } from "src/domain/empresa/dto/EmpresaResponseDto";
import { EmpresaRepository } from "src/domain/empresa/Empresa.repository";

export class FindByIdEmpresaUseCase {
  constructor(private readonly empresaRepo: EmpresaRepository) {}

  async execute(id: number): Promise<EmpresaResponseDto | null> {
    return this.empresaRepo.findById(id, false);
  }
}
