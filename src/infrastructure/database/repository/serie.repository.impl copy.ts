import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClienteMapper } from 'src/infrastructure/mapper/ClienteMapper';
import { SerieRepository } from 'src/domain/series/Serie.repository';
import { CreateSerieDto } from 'src/domain/series/dto/CreateSerieDto';
import { SerieResponseDto } from 'src/domain/series/dto/SerieResponseDto';
import { SerieOrmEntity } from '../entity/SerieOrmEntity';
import { SerieMapper } from 'src/infrastructure/mapper/SerieMapper';
import { UpdateSerieDto } from 'src/domain/series/dto/UpdateSerieDto';

@Injectable()
export class ClienteRepositoryImpl implements SerieRepository {
  constructor(
    @InjectRepository(SerieOrmEntity)
    private readonly repo: Repository<SerieOrmEntity>,
  ) {}

  async save(serie: CreateSerieDto): Promise<{ status: boolean; message: string; data?: SerieResponseDto }> {
    const newCliente = await this.repo.save(serie);
    return {
      status: true,
      message: 'Serie registrado correctamente',
      data: SerieMapper.toDomain(newCliente),
    };
  }

  async findAll(): Promise<SerieResponseDto[]> {
    const result = await this.repo.find({
      relations: ['empresa'],
    });
    return result.map((s) => SerieMapper.toDomain(s));
  }

  async findById(id: number): Promise<SerieResponseDto | null> {
    const serie = await this.repo.findOne({
      where: { serieId: id },
      relations: ['empresa'],
    });
    if (!serie) {
      throw new NotFoundException(`Serie con id ${id} no encontrado`);
    }
    return SerieMapper.toDomain(serie)
  }
  async update(serie: UpdateSerieDto, serieId:number): Promise<{ status: boolean; message: string; data?: SerieResponseDto }> {
    serie.serieId = serieId
    const update = await this.repo.save(ClienteMapper.dtoToOrmUpdate(serie));
    return {
      status: true,
      message: 'Actualizado correctamente',
      data: SerieMapper.toDomain(update),
    };
  }
  actualizarCorrelativo(serieId: number, usuarioId: number, newCorrelativo:number, motivo:string): Promise<{ status: boolean; message: string; data?: SerieResponseDto; }> {
    throw new Error('Method not implemented.');
  }
}
