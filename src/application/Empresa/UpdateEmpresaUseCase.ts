import { NotFoundException } from "@nestjs/common";
import { EmpresaResponseDto } from "src/domain/empresa/dto/EmpresaResponseDto";
import { UpdateEmpresaDto } from "src/domain/empresa/dto/UpdateEmpresaDto";
import { EmpresaRepository } from "src/domain/empresa/Empresa.repository";

export class UpdateEmpresaUseCase {
  constructor(private readonly productoRepo: EmpresaRepository) {}
  async execute(data: UpdateEmpresaDto, empresaId: number): Promise<{status: boolean, message: string, data?: EmpresaResponseDto}> {
    const empresa = await this.productoRepo.findById(empresaId, false);
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return this.productoRepo.update(data, empresaId);
  }
}
