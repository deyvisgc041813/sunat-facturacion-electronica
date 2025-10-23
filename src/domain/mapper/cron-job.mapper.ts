import { EmpresaMapper } from './empresa.mapper';
import { CronJobOrmEntity } from 'src/infrastructure/persistence/parent/entity/scheduler/cron_job.orm.entity';
import { CronJobResponseDto } from '../parent/scheduler/dto/cron-job.response.dto';
import { CreateCronJobDto } from '../parent/scheduler/dto/create-cron-job.request.dto';
import { UpdateCronJobDto } from '../parent/scheduler/dto/update-cron-job.request.dto';
import { EEstadosCronJob } from 'src/util/estado.enum';

export class CronJobMapper {
  static toDomain(orm: CronJobOrmEntity): CronJobResponseDto {
    const empresa = orm.empresa
      ? EmpresaMapper.toDomain(orm.empresa, false)
      : undefined;
    return new CronJobResponseDto(
      orm.cronId,
      orm.tipo,
      orm.horaEjecucion,
      orm.proximaEjecucion,
      orm.repetir,
      orm.estado,
      orm.payload,
      orm.ultimaEjecucion,
      orm.messageError,
      empresa,
    );
  }

  private static mapCommonFields(source: any, target: CronJobOrmEntity): void {
    target.empresa = source?.empresaId
      ? ({ empresaId: source.empresaId } as any)
      : null;
    target.tipo = source?.tipo;
    target.horaEjecucion = source?.horaEjecucion;
    target.proximaEjecucion = source?.proximaEjecucion;
    target.repetir = source?.repetir;
    target.payload = source.payload;
    target.ultimaEjecucion = source?.ultimaEjecucion;
  }

  static dtoToOrmCreate(dto: CreateCronJobDto): CronJobOrmEntity {
    const entity = new CronJobOrmEntity();
    this.mapCommonFields(dto, entity);
    entity.estado = EEstadosCronJob.PROGRAMADO
    return entity;
  }

  static dtoToOrmUpdate(
    dto: UpdateCronJobDto,
    conId: number,
  ): CronJobOrmEntity {
    const entity = new CronJobOrmEntity();
    this.mapCommonFields(dto, entity);
    entity.cronId = conId;
    return entity;
  }
}
