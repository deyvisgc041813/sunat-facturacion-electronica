import { IUserPayload } from "src/adapter/decorator/user.decorator.interface";
import { BusinessLogicException } from "src/adapter/web/exception/exeception-dynamic";
import { GenericResponse } from "src/adapter/web/response/response.interface";
import { EmpresaResponseDto } from "src/domain/parent/empresa/dto/external.response.dto";
import { UpdateEmpresaDto } from "src/domain/parent/empresa/dto/update.request";
import { EmpresaService } from "src/domain/parent/empresa/services/empresa.service";
export class UpdateEmpresaUseCase {
  constructor(private readonly empresaService: EmpresaService) {}
  async execute(data: UpdateEmpresaDto, empresaId: number, auth: IUserPayload):Promise<GenericResponse<EmpresaResponseDto>> {
    const empresa = await this.empresaService.getById(empresaId);
    if (!empresa) throw new BusinessLogicException('Empresa no encontrada');
    return this.empresaService.update(auth.credencialId ?? 0, empresa, data, auth);
  }
}
