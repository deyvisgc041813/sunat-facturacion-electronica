
import { IUserPayload } from "src/adapter/decorator/user.decorator.interface";
import { GenericResponse } from "src/adapter/web/response/response.interface";
import { SucursalService } from "src/domain/sucursal/service/sucursal.service";
export class BranchStatusSucursalUseCase {
  constructor(private readonly sucursalService: SucursalService) {}
  async execute(sucursalId:number, newEstado:number, auth: IUserPayload): Promise<GenericResponse<void>> {
    return this.sucursalService.branchStatus(sucursalId, newEstado, auth);
  }


}
