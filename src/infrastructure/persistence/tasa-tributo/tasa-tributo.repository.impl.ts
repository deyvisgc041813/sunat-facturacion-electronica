import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ITributoTasaRepository } from 'src/domain/tributo-tasa/tasa-tributo.repository';
import { CreateTributoTasaDto } from 'src/domain/tributo-tasa/dto/CreateTributoTasaDto';
import { TributoTasaResponseDto } from 'src/domain/tributo-tasa/dto/TributoTasaResponseDto';
import { TributoTasaOrmEntity } from './TributoTasaOrmEntity';
import { TributoTasaMapper } from 'src/domain/mapper/TributoTasaMapper';

@Injectable()
export class TributoTasaRepositoryImpl  implements ITributoTasaRepository {
  constructor(
    @InjectRepository(TributoTasaOrmEntity)
    private readonly repo: Repository<TributoTasaOrmEntity>
  ) {}
  findAll(tasaId: number): Promise<TributoTasaResponseDto[]> {
    throw new Error('Method not implemented.');
  }
  async findByCodigoSunat(
    codigoSunat: string
  ): Promise<TributoTasaResponseDto | null> {
    const entity = await this.repo.findOne({
      where: {
        codigoSunat
      },
    });
    return entity ? TributoTasaMapper.toDomain(entity) : null;
  }
  async findByCodigosSunat( codigosSunat: string[] ): Promise<TributoTasaResponseDto[] | null> {
    const entity = await this.repo.find({
      where: {
        codigoSunat: In(codigosSunat)
      },
    });
    return entity ? entity.map(tasa => TributoTasaMapper.toDomain(tasa)) : null;
  }
  async save(
    tasa: CreateTributoTasaDto,
  ): Promise<{ status: boolean; message: string; data?: TributoTasaResponseDto }> {
    await this.repo.save(TributoTasaMapper.dtoToOrmCreate(tasa));
    return {
      status: true,
      message: 'Tasa tributo registrado correctamente',
    };
  }
}
