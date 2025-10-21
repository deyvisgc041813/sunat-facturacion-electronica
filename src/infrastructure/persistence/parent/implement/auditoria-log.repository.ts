import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditoriaLogsMapper } from 'src/domain/mapper/auditoria-logs.mapper';

import { AuditoriaLogOrmEntity } from '../entity/auditoria.log.orm.entity';
import { IAuditoriaLogsRepositoryPort } from 'src/domain/parent/core/logs/ports/auditoria-logs.port';
import { ICreateAuditoriaLog } from 'src/domain/parent/core/logs/dto/create.auditoria-logs';
import { AuditoriaLogsResponseDto } from 'src/domain/parent/core/logs/dto/auditoria-logs.response.dto';

export class AuditoriaLogsRepositoryImpl
  implements IAuditoriaLogsRepositoryPort
{
  constructor(
    @InjectRepository(AuditoriaLogOrmEntity)
    private readonly repo: Repository<AuditoriaLogOrmEntity>,
  ) {}
  async save(auditoria: ICreateAuditoriaLog): Promise<void> {
    await this.repo.save(AuditoriaLogsMapper.dtoToOrmCreate(auditoria));
  }
  async findBySucursalId(
    sucursalId: number,
  ): Promise<AuditoriaLogsResponseDto[]> {
    const logs = await this.repo.find({
      where: { sucursalId },
      order: { fechaAccion: 'DESC' },
    });
    return logs.map((log) => AuditoriaLogsMapper.toDomain(log));
  }
  async findByIdAndSucursalId(
    logId: number,
    sucursalId: number,
  ): Promise<AuditoriaLogsResponseDto | null> {
    const log = await this.repo.findOne({ where: { logId, sucursalId } });
    if (!log) return null;
    return AuditoriaLogsMapper.toDomain(log);
  }
  async findById(logId: number): Promise<AuditoriaLogsResponseDto | null> {
    const log = await this.repo.findOne({ where: { logId } });
    if (!log) return null;
    return AuditoriaLogsMapper.toDomain(log);
  }
  async findAll(): Promise<AuditoriaLogsResponseDto[]> {
    const logs = await this.repo.find({
      order: { fechaAccion: 'DESC' },
    });
    return logs.map((log) => AuditoriaLogsMapper.toDomain(log));
  }
}
