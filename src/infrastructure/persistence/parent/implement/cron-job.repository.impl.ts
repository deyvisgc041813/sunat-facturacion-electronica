import { CronJobMapper } from '../../../../domain/mapper/cron-job.mapper';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { EEstadosCronJob, EEstadosGlobales } from 'src/util/estado.enum';
import { ICronJobRepositoryPort } from 'src/domain/parent/scheduler/ports/cron-job.repository.port';
import { CreateCronJobDto } from 'src/domain/parent/scheduler/dto/create-cron-job.request.dto';
import { CronJobResponseDto } from 'src/domain/parent/scheduler/dto/cron-job.response.dto';
import { UpdateCronJobDto } from 'src/domain/parent/scheduler/dto/update-cron-job.request.dto';
import { CronJobOrmEntity } from '../entity/scheduler/cron_job.orm.entity';
import { BusinessLogicException } from 'src/adapter/web/exception/exeception-dynamic';

@Injectable()
export class CronJobRepositoryImpl implements ICronJobRepositoryPort {
  constructor(
    @InjectRepository(CronJobOrmEntity)
    private readonly repo: Repository<CronJobOrmEntity>,
  ) {}

  async save(
    dto: CreateCronJobDto,
  ): Promise<GenericResponse<CronJobResponseDto>> {
    const newCron = await this.repo.save(CronJobMapper.dtoToOrmCreate(dto));

    let resp = CronJobMapper.toDomain(newCron);
    return {
      status: true,
      message: 'La tarea programada se registró correctamente.',
      data: resp,
    };
  }
  async findAll(): Promise<CronJobResponseDto[]> {
    const result = await this.repo.find({
      where: {
        estado: In([EEstadosGlobales.ACTIVO]),
      },
      relations: ['empresa', 'empresa.sucursal'],
      order: {
        proximaEjecucion: 'ASC',
      },
    });
    return result.map((empresa) => CronJobMapper.toDomain(empresa));
  }
  async findById(cronJobId:number): Promise<CronJobResponseDto | null> {
    const result = await this.repo.findOne({
      where: {
        cronId: cronJobId,
        estado: In([EEstadosGlobales.ACTIVO]),
      },
      relations: ['empresa', 'empresa.sucursal']
    });
    if(!result) throw new BusinessLogicException("No se encontro información para la tarea programada consultada")
    return CronJobMapper.toDomain(result)
  }
  async findNextActiveJob(): Promise<CronJobResponseDto[]> {
    const cronJob = await this.repo.find({where: {estado: EEstadosCronJob.PROGRAMADO}, order: {proximaEjecucion: "ASC"}, relations: ["empresa"]})
    return cronJob.map((empresa) => CronJobMapper.toDomain(empresa));
  }
  findByEmpresa(empresaId: number): Promise<any | null> {
    throw new Error('Method not implemented.');
  }
  update(
    dto: UpdateCronJobDto,
    cronId: number,
  ): Promise<GenericResponse<void>> {
    throw new Error('Method not implemented.')
  }
  async updateStatus(
    cronId: number,
    nuevoEstado: EEstadosCronJob,
    messageError:string
  ): Promise<GenericResponse<void>> {
    const cron = await this.repo.findOne({
      where: { cronId },
    });

    if (!cron) {
      console.log(`Cron con ID ${cronId} no encontrado`);
    }
    await this.repo.update({cronId}, {
      estado: nuevoEstado,
      messageError: messageError ? messageError : undefined
    });
    return {
      status: true,
      message: 'El estado se actualizó correctamente.',
    };
  }
 async updateExecutionStatus(
    cronId: number,
    repetir: boolean,
    proxima: Date,
  ): Promise<void> {
    await this.repo.update({cronId}, {
      ultimaEjecucion: new Date(),
      proximaEjecucion: proxima,
      estado: EEstadosCronJob.EJECUTADO,
    });
  }



}
