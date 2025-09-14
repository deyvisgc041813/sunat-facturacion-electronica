import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SunatLogRepository } from 'src/domain/sunat-log/SunatLog.repository';
import { CreateSunatLogDto, SunatLogResponseDto } from 'src/domain/sunat-log/interface/sunat.log.interface';
import { SunatLogOrmEntity } from '../entity/SunatLogOrmEntity';
import { SunatLogMapper } from 'src/infrastructure/mapper/SunatLogMapper';

@Injectable()
export class SunatLogRepositoryImpl implements SunatLogRepository {
  constructor(
    @InjectRepository(SunatLogOrmEntity)
    private readonly repo: Repository<SunatLogOrmEntity>,
  ) {}

  async save(log: CreateSunatLogDto): Promise<{ status: boolean; message: string; data?: SunatLogResponseDto }> {
     await this.repo.save(SunatLogMapper.dtoToOrmCreate(log));
    return {
      status: true,
      message: 'log registrado correctamente',
    };
  }
  async findAll(): Promise<SunatLogResponseDto[]> {
    const result = await this.repo.find({
      relations: ['comprobante'],
    });
    return result.map((s) => SunatLogMapper.toDomain(s));
  }
  async findById(id: number): Promise<SunatLogResponseDto | null> {
    const serie = await this.repo.findOne({
      where: { id: id },
      relations: ['comprobante'],
    });
    if (!serie) {
      throw new NotFoundException(`Log con id ${id} no encontrado`);
    }
    return SunatLogMapper.toDomain(serie)
  }
}
