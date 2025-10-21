import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { get } from 'axios';
import { User } from 'src/adapter/decorator/user.decorator';
import type { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { CreateCronJobUseCase } from 'src/application/parent/cron-job/create.cron.job.usecase';
import { DeleteCronJobUseCase } from 'src/application/parent/cron-job/delete.cron-job.usecase';
import { GetAllCronJobUseCase } from 'src/application/parent/cron-job/get-all.usecase';
import { GetCronJobByEmpresaUseCase } from 'src/application/parent/cron-job/get-cron-job-by-empresa.usecase';
import { GetCronJobByIdUseCase } from 'src/application/parent/cron-job/get-cron-job-by-id-empresa.usecase';
import { BranchStatusCronJobUseCase } from 'src/application/parent/cron-job/update-status.cron-job.usecase';
import { CreateCronJobDto } from 'src/domain/parent/scheduler/dto/create-cron-job.request.dto';
import { CronRunnerService } from 'src/domain/parent/scheduler/service/cron-job-runner.service';
@UseGuards(JwtAuthGuard)
@Controller('companies/branch/cron-jobs')
export class CronJobController {
  constructor(
    private readonly createUseCase: CreateCronJobUseCase,
    private readonly getAllUseCase: GetAllCronJobUseCase,
    private readonly getByIdUseCase: GetCronJobByIdUseCase,
    private readonly getByEmpresaUseCase: GetCronJobByEmpresaUseCase,
    private readonly deleteUseCase: DeleteCronJobUseCase,
    private readonly updateStatusUseCase: BranchStatusCronJobUseCase,
    private readonly cronRunnerService: CronRunnerService
  ) {}

  @Post()
  crear(@Body() body: CreateCronJobDto, @User() auth: IUserPayload) {
    return this.createUseCase.execute(body, auth);
  }

  @Get()
  getAll() {
    return this.getAllUseCase.execute();
  }
  @Get("/init") 
  iniciar() {
    return this.cronRunnerService.iniciarScheduler()
  }
}
