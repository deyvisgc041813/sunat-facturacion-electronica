import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { CreateEmpresaOnboardingDto } from 'src/domain/parent/empresa/dto/create.request.onboarding.dto';
import { EmpresaResponseDto } from 'src/domain/parent/empresa/dto/external.response.dto';
import { EmpresaService } from 'src/domain/parent/empresa/services/empresa.service';
export class CreateEmpresaBoardingUseCase {
  constructor(private readonly empresaService: EmpresaService) {}
  async execute(
    data: CreateEmpresaOnboardingDto,
    auth: IUserPayload,
  ): Promise<GenericResponse<EmpresaResponseDto>> {
    return this.empresaService.createOnboarding(data, auth);
  }
}
