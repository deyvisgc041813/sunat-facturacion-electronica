import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorLogRepository } from 'src/domain/error-log/ErrorLog.repository';
import { CreateErrorLogDto } from 'src/domain/error-log/dto/CreateErrorLogDto';
import { ErrorLogResponseDto } from 'src/domain/error-log/dto/ErrorLogResponseDto';
import { ErrorLogOrmEntity } from './ErrorLogOrmEntity';
import { ErrorLogMapper } from 'src/domain/mapper/ErrorLogMapper';

@Injectable()
export class ErrorLogRepositoryImpl implements ErrorLogRepository {
  constructor(
    @InjectRepository(ErrorLogOrmEntity)
    private readonly repo: Repository<ErrorLogOrmEntity>,
  ) {}

  async save(data: CreateErrorLogDto): Promise<{ status: boolean; message: string; data?: ErrorLogResponseDto }> {
    const create = await this.repo.save(data);
    return {
      status: true,
      message: 'log registrado correctamente',
      data: ErrorLogMapper.toDomain(create),
    };
  }

  async findAll(): Promise<ErrorLogResponseDto[]> {
    const result = await this.repo.find({
      relations: ['serie', 'usario'],
    });
    return result.map((s) => ErrorLogMapper.toDomain(s));
  }

  async findById(id: number): Promise<ErrorLogResponseDto | null> {
    const serie = await this.repo.findOne({
      where: { errorId: id }
    });
    if (!serie) {
      throw new NotFoundException(`Log con id ${id} no encontrado`);
    }
    return ErrorLogMapper.toDomain(serie)
  }
}
