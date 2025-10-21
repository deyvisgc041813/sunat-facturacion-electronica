
import { IUserPayload } from "src/adapter/decorator/user.decorator.interface";
import { GenericResponse } from "src/adapter/web/response/response.interface";
import { CronService } from "src/domain/parent/scheduler/service/cron-job.service";
export class DeleteCronJobUseCase {
  constructor(private readonly cronJobService: CronService) {}
  async execute(cronJobId:number, auth: IUserPayload): Promise<GenericResponse<void>> {
    return this.cronJobService.delete(cronJobId, auth);
  }


}
