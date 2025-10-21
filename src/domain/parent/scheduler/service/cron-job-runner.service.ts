import { Injectable, Logger } from '@nestjs/common';
import { CronService } from './cron-job.service';
import { CronJobResponseDto } from '../dto/cron-job.response.dto';
import { SummaryDocumentDto } from 'src/domain/tenant/resumen/dto/summary-document.dto';
import { getFechaHoraActualLimaFormat } from 'src/util/Helpers';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { ResumenService } from 'src/domain/tenant/resumen/service/resumen.service';

@Injectable()
export class CronRunnerService {
  private readonly logger = new Logger(CronRunnerService.name);
  private timeoutRefs: Map<number, NodeJS.Timeout> = new Map();
  private revisionRef: NodeJS.Timeout | null = null;

  //  Revisión cada X minutos
  private readonly INTERVALO_MINUTOS = 0.2;
  constructor(
    private readonly cronService: CronService,
   private readonly resumenService: ResumenService,
  ) {}

  // Inicia el scheduler
  async iniciarScheduler() {
    this.logger.log(
      `Scheduler iniciadssso (revisión cada ${this.INTERVALO_MINUTOS} min)...`,
    );
        // this.resumenService = await this.moduleRef.resolve(ResumenService);
    await this.programarProxima();
    await this.iniciarRevisionAutomatica();
  }

  // Busca todas las tareas activas y las programa
  private async programarProxima() {
    const tareas = await this.cronService.findNextActiveJob();
    if (!tareas || tareas.length === 0) {
      this.logger.log(
        `⏸ No hay tareas activas. Revisando en ${this.INTERVALO_MINUTOS} minuto[s]...`,
      );
      this.reprogramarEnGlobal(this.INTERVALO_MINUTOS * 60 * 1000);
      return;
    }

    for (const tarea of tareas) {
      try {
        const diff = new Date(tarea.proximaEjecucion).getTime() - Date.now();

        if (diff <= 0) {
          this.logger.log(`Ejecutando tarea inmediata (${tarea.tipo})`);
          this.ejecutarTarea(tarea); // sin await → no bloquea
          continue;
        }
        const min = Math.round(diff / 60000);
        this.logger.log(`Próxima tarea (${tarea.tipo}) en ${min} min`);
        this.programarTareaIndividual(tarea, diff);
      } catch (error: any) {
        this.logger.error(`Error programando ${tarea.tipo}: ${error.message}`);
      }
    }
  }

  //Reprograma la búsqueda global de tareas
  private reprogramarEnGlobal(ms: number) {
    setTimeout(() => this.programarProxima(), ms);
  }

  // Programa una tarea individual según su tiempo
  private programarTareaIndividual(tarea: CronJobResponseDto, delayMs: number) {
    if (this.timeoutRefs.has(tarea.cronId)) {
      clearTimeout(this.timeoutRefs.get(tarea.cronId)!);
    }

    const ref = setTimeout(async () => {
      try {
        await this.ejecutarTarea(tarea);
      } catch (error: any) {
        this.logger.error(`Error ejecutando ${tarea.tipo}: ${error.message}`);
        await this.cronService.marcarEnError(tarea.cronId, error);
      } finally {
        this.timeoutRefs.delete(tarea.cronId);
      }
    }, delayMs);

    this.timeoutRefs.set(tarea.cronId, ref);
  }

  // Revisión automática basada en INTERVALO_MINUTOS
  private async iniciarRevisionAutomatica() {
    if (this.revisionRef) clearInterval(this.revisionRef);
    const ms = this.INTERVALO_MINUTOS * 60 * 1000;
    this.logger.log(`Revisión automática cada ${this.INTERVALO_MINUTOS} min...`);

    this.revisionRef = setInterval(async () => {
      this.logger.log(`Revisando tareas activas...`);
      await this.programarProxima();
    }, ms);
  }

  // Ejecuta una tarea programada según tipo
  private async ejecutarTarea(tarea: CronJobResponseDto): Promise<void> {
    const { cronId, empresa, tipo } = tarea;
    const empresaId = empresa?.empresaId ?? 0;

    try {
      this.logger.log(`Ejecutando ${tipo} para empresa ${empresaId}`);
      await this.cronService.marcarEnProceso(cronId);

      switch (tipo) {
        case 'RESUMEN_DIARIO':
          await this.enviarResumenSunat(tarea);
          break;
        case 'BACKUP_DATABASE':
          await this.hacerBackup(empresaId);
          break;
        case 'REINTENTOS':
          await this.reintentarPendientes(empresaId);
          break;
        default:
          this.logger.warn(`Tipo de tarea desconocido: ${tipo}`);
      }
    } catch (error: any) {
      this.logger.error(`Error ejecutando ${tipo}: ${error.message}`);
      await this.cronService.marcarEnError(cronId, error);
    }
  }

  private async enviarResumenSunat(tarea: CronJobResponseDto): Promise<void> {

    const empresaId = tarea?.empresa?.empresaId;
    const cronJobId = tarea.cronId;
    const payload = tarea?.payload;
    const context = `CronJob:enviarResumenSunat[empresa:${empresaId}]`;
    const inicio = Date.now();
    this.logger.log(`Ejecutando tarea RESUMEN_DIARIO empresa ${empresaId}`);
    try {
      if (!payload?.company || !payload?.serieResumen || !payload?.auth) {
        const msg = `Payload incompleto. Faltan campos requeridos: company, serieResumen, auth`;
        this.logger.warn(msg, context);
        await this.cronService.marcarEnError(cronJobId, msg);
        return;
      }
      const auth = payload.auth as IUserPayload;

      const data = new SummaryDocumentDto();
      data.ublVersion = '2.0';
      data.customizationID = '1.1';
      data.fecReferencia = getFechaHoraActualLimaFormat('YYYY-MM-DDTHH:mm:ssZ') //"2025-09-11T12:26:13-05:00";
      data.serieResumen = payload.serieResumen;
      data.company = payload.company;
      data.sucursalId = payload.sucursalId ?? auth.sucursalActiva ?? 1;
      const rpta = await this.resumenService.iniciarProceso(data, auth);
      this.logger.warn( `[CRON:RESUMEN_DIARIO][Empresa:${empresaId}] → Respuesta SUNAT: ${rpta.message} | Status: ${rpta.status}`
      );
      const duracion = ((Date.now() - inicio) / 1000).toFixed(2);

      // Programar siguiente ejecución
      await this.programarProximaPorTipo(
        cronJobId,
        tarea.horaEjecucion,
        tarea.repetir,
        tarea.tipo,
      );
      this.logger.log(
        `[${context}] Resumen diario enviado correctamente (Duración: ${duracion}s)`,
      );
    } catch (error: any) {
      const mensajeError = `[${context}] Error en envío → ${error.message}`;
      this.logger.error(mensajeError, error.stack, context);
      await this.cronService.marcarEnError(cronJobId, error);
    } finally {
      const duracion = ((Date.now() - inicio) / 1000).toFixed(2);
      this.logger.log(`[${context}] Finalizó tarea (${duracion}s)`);
    }
  }

  // Caso: Backup de base de datos
  private async hacerBackup(empresaId: number) {
    this.logger.log(` Generando backup empresa ${empresaId}`);
    // Implementar tu lógica de backup aquí
  }

  // Caso: Reintentos de comprobantes pendientes
  private async reintentarPendientes(empresaId: number) {
    this.logger.log(` Reintentando comprobantes empresa ${empresaId}`);
    // Implementar tu lógica de reintento aquí
  }

  // Reprograma la tarea según su tipo y configuración
  private async programarProximaPorTipo(
    cronId: number,
    horaEjecucion: string,
    repetir: string,
    tipo: string,
  ): Promise<void> {
    let nuevaProxima: any | null = null;

    if (repetir == '1') {
      const [hh, mm] = horaEjecucion.split(':').map(Number);
      const ahora = new Date();
      nuevaProxima = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate() + 1,
        hh,
        mm,
        0,
      );
    }
    await this.cronService.marcarEjecutado(
      cronId,
      repetir == '1',
      nuevaProxima,
    );
    this.logger.log(`${tipo} completado correctamente`);
  }
}
