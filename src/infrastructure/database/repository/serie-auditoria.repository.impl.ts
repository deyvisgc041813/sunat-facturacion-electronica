import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateSerieDto } from 'src/domain/series/dto/UpdateSerieDto';
import { SerieAuditoriaRepository } from 'src/domain/series-auditoria/Serie.repository';
import { CreateSerieAuditoriaDto } from 'src/domain/series-auditoria/dto/CreateSerieAuditoriaDto';
import { SerieAuditoriaResponseDto } from 'src/domain/series-auditoria/dto/SerieAuditoriaResponseDto';
import { SerieAuditoriaOrmEntity } from '../entity/SerieAuditoriaOrmEntity';
import { SerieAuditoriaMapper } from 'src/infrastructure/mapper/SerieAuditoriaMapper';

@Injectable()
export class SerieAuditoriaRepositoryImpl implements SerieAuditoriaRepository {
  constructor(
    @InjectRepository(SerieAuditoriaOrmEntity)
    private readonly repo: Repository<SerieAuditoriaOrmEntity>,
  ) {}

  async save(serie: CreateSerieAuditoriaDto): Promise<{ status: boolean; message: string; data?: SerieAuditoriaResponseDto }> {
    const create = await this.repo.save(serie);
    return {
      status: true,
      message: 'log registrado correctamente',
      data: SerieAuditoriaMapper.toDomain(create),
    };
  }

  async findAll(): Promise<SerieAuditoriaResponseDto[]> {
    const result = await this.repo.find({
      relations: ['serie', 'usario'],
    });
    return result.map((s) => SerieAuditoriaMapper.toDomain(s));
  }

  async findById(id: number): Promise<SerieAuditoriaResponseDto | null> {
    const serie = await this.repo.findOne({
      where: { serieId: id },
      relations: ['serie', 'usario'],
    });
    if (!serie) {
      throw new NotFoundException(`Log con id ${id} no encontrado`);
    }
    return SerieAuditoriaMapper.toDomain(serie)
  }
  async update(serie: UpdateSerieDto, serieId:number): Promise<{ status: boolean; message: string; data?: SerieAuditoriaResponseDto }> {
    serie.serieId = serieId
    const update = await this.repo.save(SerieAuditoriaMapper.dtoToOrmUpdate(serie));
    return {
      status: true,
      message: 'Actualizado correctamente',
      data: SerieAuditoriaMapper.toDomain(update),
    };
  }
}
