import { CronJobResponseDto } from 'src/domain/parent/scheduler/dto/cron-job.response.dto';
import { CronService } from 'src/domain/parent/scheduler/service/cron-job.service';
export class GetAllCronJobUseCase {
  constructor(private readonly cronJobService: CronService) {}
  async execute(): Promise<CronJobResponseDto[]> {
    return this.cronJobService.getAll();
  }
}
