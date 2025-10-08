
import { IUserPayload } from "src/adapter/decorator/user.decorator.interface";
import { GenericResponse } from "src/adapter/web/response/response.interface";
import { EmpresaService } from "src/domain/empresa/services/empresa.service";
export class UpdateStatusEmpresaUseCase {
  constructor(private readonly empresaService: EmpresaService) {}
  async execute(empresaId:number, newEstado:string, auth: IUserPayload): Promise<GenericResponse<void>> {
    return this.empresaService.updateStatus(empresaId, newEstado, auth);
  }


}
