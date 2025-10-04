import { NotFoundException } from "@nestjs/common";
import { GenericResponse } from "src/adapter/web/response/response.interface";
import { EmpresaResponseDto } from "src/domain/empresa/dto/EmpresaResponseDto";
import { UpdateEmpresaDto } from "src/domain/empresa/dto/UpdateEmpresaDto";
import { EmpresaService } from "src/domain/empresa/services/empresa.service";

export class UpdateEmpresaUseCase {
  constructor(private readonly empresaService: EmpresaService) {}
  async execute(data: UpdateEmpresaDto, empresaId: number):Promise<GenericResponse<EmpresaResponseDto>> {
    const empresa = await this.empresaService.getById(empresaId);
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return this.empresaService.update(empresa, data);
  }
}
