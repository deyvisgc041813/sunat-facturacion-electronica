import { ICompanyDefault } from './../interface/resumen.diario.default.interface';
import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { CronJobRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/cron-job.repository.impl';
import { CreateCronJobDto } from '../dto/create-cron-job.request.dto';
import { CronJobResponseDto } from '../dto/cron-job.response.dto';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { EEstadosCronJob } from 'src/util/estado.enum';
import { AuditoriaService } from '../../core/logs/service/auditoria.logs.service';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { buildLogData } from 'src/common/core';
import { EAccionAudit, ETablaAudit } from 'src/util/general.enum';
import { APLICACION_ORIGEN } from 'src/util/constantes';
import { getFechaHoraActualLima } from 'src/util/Helpers';
import dayjs from 'dayjs';
import { EmpresaService } from '../../empresa/services/empresa.service';
import { TipoDocumentoIdentidadEnum } from 'src/util/catalogo.enum';
import { BusinessLogicException } from 'src/adapter/web/exception/exeception-dynamic';
@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  constructor(
    private readonly cronRepo: CronJobRepositoryImpl,
    private readonly auditoriaService: AuditoriaService,
    private readonly empresaService: EmpresaService,
  ) {}

  private calcularProximaEjecucion(horaEjecucion: string): Date {
    const [hh, mm] = horaEjecucion.split(':').map(Number);
    const ahora = getFechaHoraActualLima();
    const getFechaDays = dayjs().tz('America/Lima');
    let proxima = getFechaDays
      .set('hour', hh)
      .set('minute', mm)
      .set('second', 0)
      .set('millisecond', 0);
    // Si ya pasó, pasa al día siguiente
    if (proxima.isBefore(ahora)) {
      proxima = proxima.add(1, 'day');
    }
    // Devolvemos un Date en hora Lima (no UTC)
    return proxima.toDate();
  }

  async create(
    dto: CreateCronJobDto,
    auth: IUserPayload,
  ): Promise<GenericResponse<CronJobResponseDto>> {
    dto.empresaId = dto.empresaId ? dto.empresaId : (auth.empresaId ?? 0);
    const empresa = await this.empresaService.getById(dto.empresaId);
    const company: ICompanyDefault = {
      ruc: empresa?.ruc ?? '',
      razonSocial: empresa?.razonSocial ?? '',
      tipoDoc: TipoDocumentoIdentidadEnum.RUC,
    };
    dto.payload = {
      enviarCorreo: true,
      tipoTarea: 'RESUMEN_DIARIO',
      usuarioEjecutor: 'sistema',
      reintentos: 0,
      serieResumen: 'RC',
      company,
      auth,
      meta: {
        origen: 'CRON_JOB_SERVICE',
        descripcion: 'Generación y envío de resumen diario a SUNAT',
      },
    };
    dto.proximaEjecucion = this.calcularProximaEjecucion(dto.horaEjecucion);
    dto.repetir = dto.repetir ?? true;
    const response = await this.cronRepo.save(dto);
    const logData = buildLogData({
      tablaAfectada: ETablaAudit.CRON_JOB,
      accion: EAccionAudit.INSERT,
      valoresNuevos: dto,
      usuario: auth,
      entorno: '',
      idRegistro: response.data?.cronId,
      observacion: 'Crear tarea prorgramada',
      aplicacionOrigen: APLICACION_ORIGEN,
      sucursalId: auth.sucursalActiva,
      empresaId: dto.empresaId,
    });
    await this.auditoriaService.saveLog(logData);
    return response;
  }

  async getAll(): Promise<CronJobResponseDto[]> {
    return this.cronRepo.findAll();
  }
  async getByID(cronJobId): Promise<CronJobResponseDto | null> {
    return this.cronRepo.findById(cronJobId);
  }
  async getByEmpresa(empresaId: number): Promise<CronJobResponseDto[]> {
    return this.cronRepo.findByEmpresa(empresaId);
  }
  async marcarEjecutado(id: number, repetir: boolean, proxima: Date) {
    await this.cronRepo.updateExecutionStatus(id, repetir, proxima);
  }
  async marcarEnProceso(id: number) {
    await this.cronRepo.updateStatus(id, EEstadosCronJob.EN_PROCESO, '');
  }
  async marcarEnError(id: number, message: string) {
    await this.cronRepo.updateStatus(id, EEstadosCronJob.ERROR, message);
  }
  async findNextActiveJob() {
    return this.cronRepo.findNextActiveJob();
  }
  async updateStatus(
    cronJobId: number,
    nuevoEstado: EEstadosCronJob,
    auth: IUserPayload,
  ): Promise<GenericResponse<void>> {
    if (
      ![EEstadosCronJob.PENDIENTE, EEstadosCronJob.DESHABILITADO].includes(
        nuevoEstado,
      )
    ) {
      throw new BusinessLogicException(
        'El estado solo puede ser 001 (pendiente) o 900 (inactivo)',
      );
    }
    const sucursal = await this.cronRepo.updateStatus(
      cronJobId,
      nuevoEstado,
      '',
    );

    if (!sucursal)
      throw new BusinessLogicException('Tarea programada no encontrada');

    const accion =
      nuevoEstado === EEstadosCronJob.PENDIENTE
        ? 'Tarea Programada activada (estado=001)'
        : 'Tarea Programada desactivada (estado=900)';
    const logData = buildLogData({
      tablaAfectada: ETablaAudit.CRON_JOB,
      accion: EAccionAudit.UPDATE,
      usuario: auth,
      observacion: accion,
      idRegistro: cronJobId,
      aplicacionOrigen: APLICACION_ORIGEN,
      sucursalId: auth.sucursalActiva,
      empresaId: auth.empresaId ?? 0,
    });
    await this.auditoriaService.saveLog(logData);
    return {
      status: true,
      message: accion,
    };
  }
  async delete(
    cronJobId: number,
    auth: IUserPayload,
  ): Promise<GenericResponse<void>> {
    try {
      const rsp = await this.cronRepo.updateStatus(
        cronJobId,
        EEstadosCronJob.DESHABILITADO,
        '',
      );
      const logData = buildLogData({
        tablaAfectada: ETablaAudit.CRON_JOB,
        accion: EAccionAudit.DELETE,
        usuario: auth,
        entorno: '',
        observacion: 'Eliminar tarea programada',
        aplicacionOrigen: APLICACION_ORIGEN,
        idRegistro: cronJobId,
        sucursalId: auth.sucursalActiva,
        empresaId: auth.empresaId ?? 0,
      });
      await this.auditoriaService.saveLog(logData);
      rsp.message = 'La tarea programada se elimino correctamente';
      return rsp;
    } catch (error: any) {
      throw error;
    }
  }
}
