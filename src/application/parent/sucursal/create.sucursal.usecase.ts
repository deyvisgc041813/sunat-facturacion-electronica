
import { IUserPayload } from "src/adapter/decorator/user.decorator.interface";
import { GenericResponse } from "src/adapter/web/response/response.interface";
import { CreateSucursalDto } from "src/domain/parent/sucursal/dto/create.request.dto";
import { SucursalResponseDto } from "src/domain/parent/sucursal/dto/sucursal.response.dto";
import { SucursalService } from "src/domain/parent/sucursal/service/sucursal.service";
export class CreateSucursalUseCase {
  constructor(private readonly sucursalService: SucursalService) {}
  async execute(dto: CreateSucursalDto, auth: IUserPayload): Promise<GenericResponse<SucursalResponseDto>> {
    return this.sucursalService.create(dto, auth);
  }


}
