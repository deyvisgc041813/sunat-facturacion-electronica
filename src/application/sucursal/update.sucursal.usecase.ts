
import { IUserPayload } from "src/adapter/decorator/user.decorator.interface";
import { GenericResponse } from "src/adapter/web/response/response.interface";
import { SucursalResponseDto } from "src/domain/sucursal/dto/sucursal.response.dto";
import { UpdateSucursalDto } from "src/domain/sucursal/dto/update.request.dto";
import { SucursalService } from "src/domain/sucursal/service/sucursal.service";
export class UpdateSucursalUseCase {
  constructor(private readonly sucursalService: SucursalService) {}
  async execute(sucursalId:number, dto: UpdateSucursalDto, auth: IUserPayload): Promise<GenericResponse<SucursalResponseDto>> {
    return this.sucursalService.update(sucursalId, auth, dto);
  }


}
