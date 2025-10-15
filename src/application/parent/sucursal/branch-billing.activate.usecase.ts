import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { SucursalService } from 'src/domain/parent/sucursal/service/sucursal.service';
export class BranchBillingActivateSucursalUseCase {
  constructor(private readonly sucursalService: SucursalService) {}
  async execute(
    sucursalId: number,
    auth: IUserPayload,
  ): Promise<GenericResponse<void>> {
    return this.sucursalService.activateBranchBilling(sucursalId, auth);
  }
}
