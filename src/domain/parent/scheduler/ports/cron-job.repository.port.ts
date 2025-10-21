import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { CronJobResponseDto } from '../dto/cron-job.response.dto';
import { UpdateCronJobDto } from '../dto/update-cron-job.request.dto';
import { CreateCronJobDto } from '../dto/create-cron-job.request.dto';
import { EEstadosCronJob } from 'src/util/estado.enum';
export interface ICronJobRepositoryPort {
  save(dto: CreateCronJobDto): Promise<GenericResponse<CronJobResponseDto>>;
  findAll(): Promise<CronJobResponseDto[]>;
  findById(cronJobId:number): Promise<CronJobResponseDto | null>
  findByEmpresa(empresaId:number): Promise<any | null>;
   findNextActiveJob(): Promise<CronJobResponseDto[]>
  update(
    dto: UpdateCronJobDto,
    cronId:number
  ): Promise<GenericResponse<void>>;
  updateStatus(
    cronId: number,
    nuevoEstado: EEstadosCronJob,
    messageError:string
  ): Promise<GenericResponse<void>>;
  updateExecutionStatus(id: number, repetir: boolean, proxima: Date | null): Promise<void>;
}
