
import { IUserPayload } from "src/adapter/decorator/user.decorator.interface";
import { GenericResponse } from "src/adapter/web/response/response.interface";
import { EmpresaService } from "src/domain/parent/empresa/services/empresa.service";
export class DeleteEmpresaUseCase {
  constructor(private readonly empresaService: EmpresaService) {}
  async execute(empresaId:number, auth: IUserPayload): Promise<GenericResponse<void>> {
    return this.empresaService.delete(empresaId, auth);
  }


}
