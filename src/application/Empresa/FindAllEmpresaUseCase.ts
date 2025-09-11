import { EmpresaResponseDto } from "src/domain/empresa/dto/EmpresaResponseDto";
import { EmpresaRepository } from "src/domain/empresa/Empresa.repository";

export class FindAllEmpresaUseCase {
  constructor(private readonly empresaRepo: EmpresaRepository) {}

  async execute(): Promise<EmpresaResponseDto[]> {
    return this.empresaRepo.findAll();
  }
}
