import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { CreateEmpresaDto } from 'src/domain/parent/empresa/dto/create.request.dto';
import { EmpresaResponseDto } from 'src/domain/parent/empresa/dto/external.response.dto';
import { EmpresaService } from 'src/domain/parent/empresa/services/empresa.service';
export class CreateEmpresaUseCase {
  constructor(private readonly empresaService: EmpresaService) {}
  async execute(
    data: CreateEmpresaDto,
    auth: IUserPayload,
  ): Promise<GenericResponse<EmpresaResponseDto>> {
    return this.empresaService.save(data, auth);
  }
}
