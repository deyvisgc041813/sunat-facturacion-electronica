
import { IUserPayload } from "src/adapter/decorator/user.decorator.interface";
import { GenericResponse } from "src/adapter/web/response/response.interface";
import { CronService } from "src/domain/parent/scheduler/service/cron-job.service";
import { SucursalResponseDto } from "src/domain/parent/sucursal/dto/sucursal.response.dto";
import { UpdateSucursalDto } from "src/domain/parent/sucursal/dto/update.request.dto";
import { SucursalService } from "src/domain/parent/sucursal/service/sucursal.service";
export class UpdateCronJobUseCase {
  // constructor(private readonly cronJobService: CronService) {}
  // async execute(sucursalId:number, dto: UpdateSucursalDto, auth: IUserPayload): Promise<GenericResponse<void>> {

  //   //return this.cronJobService.(sucursalId, auth, dto);
  // }

}
