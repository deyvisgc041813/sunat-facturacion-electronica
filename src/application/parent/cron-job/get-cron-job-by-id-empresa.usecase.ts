import { CronJobResponseDto } from 'src/domain/parent/scheduler/dto/cron-job.response.dto';
import { CronService } from 'src/domain/parent/scheduler/service/cron-job.service';
export class GetCronJobByIdUseCase {
  constructor(private readonly cronJobService: CronService) {}
  async execute(cronJobId: number): Promise<CronJobResponseDto | null> {
    return this.cronJobService.getByID(cronJobId);
  }
}
