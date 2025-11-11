
import { Injectable } from "@nestjs/common";
import { IUserPayload } from "src/adapter/decorator/user.decorator.interface";
import { GenericResponse } from "src/adapter/web/response/response.interface";
import { CreateCronJobDto } from "src/domain/parent/scheduler/dto/create-cron-job.request.dto";
import { CronJobResponseDto } from "src/domain/parent/scheduler/dto/cron-job.response.dto";
import { CronService } from "src/domain/parent/scheduler/service/cron-job.service";
@Injectable()
export class CreateCronJobUseCase {
  constructor(private readonly cronJobService: CronService) {}
  async execute(dto: CreateCronJobDto, auth: IUserPayload): Promise<GenericResponse<CronJobResponseDto>> {
    return this.cronJobService.create(dto, auth);
  }
}
