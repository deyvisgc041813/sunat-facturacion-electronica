import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { CronService } from 'src/domain/parent/scheduler/service/cron-job.service';
import { EEstadosCronJob } from 'src/util/estado.enum';
export class BranchStatusCronJobUseCase {
  constructor(private readonly cronJobService: CronService) {}
  async execute(
    sucursalId: number,
    newEstado: string,
    auth: IUserPayload,
  ): Promise<GenericResponse<void>> {
    return this.cronJobService.updateStatus(sucursalId, newEstado as EEstadosCronJob, auth);
  }
}
