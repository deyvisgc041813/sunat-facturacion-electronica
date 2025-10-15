import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ICreateAuditoriaLog } from '../dto/create.auditoria-logs';
import { AuditoriaLogsResponseDto } from '../dto/auditoria-logs.response.dto';
import { AuditoriaLogsRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/auditoria-log.repository';
@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private readonly logsRepo: AuditoriaLogsRepositoryImpl) {}

  async saveLog(
    data: ICreateAuditoriaLog
  ): Promise<void> {
    try {
      await this.logsRepo.save(data);
      this.logger.debug(`Auditoría registrada: ${data.accion} en ${data.tablaAfectada} (sucursalId: ${data.sucursalId ?? 'N/A'})`);
    } catch (error) {
      this.logger.error('Error al registrar log de auditoría', error.stack);
      throw error;
    }
  }

  async findAll(): Promise<AuditoriaLogsResponseDto[]> {
    return this.logsRepo.findAll();
  }

  async findById(idLog: number): Promise<AuditoriaLogsResponseDto> {
    const log = await this.logsRepo.findById(idLog);
    if (!log) {
      throw new NotFoundException(`No se encontró el log con id ${idLog}`);
    }
    return log;
  }
  async findBySucursalId(
    sucursalId: number,
  ): Promise<AuditoriaLogsResponseDto[]> {
    return this.logsRepo.findBySucursalId(sucursalId);
  }
  async findByIdAndSucursalId(
    logId: number,
    sucursalId: number,
  ): Promise<AuditoriaLogsResponseDto | null> {
    return this.logsRepo.findByIdAndSucursalId(logId, sucursalId);
  }
}
