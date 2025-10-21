import { CronJobResponseDto } from 'src/domain/parent/scheduler/dto/cron-job.response.dto';
import { CronService } from 'src/domain/parent/scheduler/service/cron-job.service';
export class GetCronJobByEmpresaUseCase {
  constructor(private readonly cronJobService: CronService) {}
  async execute(  empresaId: number): Promise<CronJobResponseDto[]> {
    return this.cronJobService.getByEmpresa(empresaId);
  }
}
