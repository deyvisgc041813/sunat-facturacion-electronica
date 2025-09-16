import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TributoTasaRepository } from 'src/domain/tributo-tasa/tasa-tributo.repository';
import { CreateTributoTasaDto } from 'src/domain/tributo-tasa/dto/CreateTributoTasaDto';
import { TributoTasaResponseDto } from 'src/domain/tributo-tasa/dto/TributoTasaResponseDto';
import { TributoTasaMapper } from 'src/infrastructure/mapper/TributoTasaMapper';
import { TributoTasaOrmEntity } from '../entity/TributoTasaOrmEntity';

@Injectable()
export class TributoTasaRepositoryImpl  implements TributoTasaRepository {
  constructor(
    @InjectRepository(TributoTasaOrmEntity)
    private readonly repo: Repository<TributoTasaOrmEntity>
  ) {}
  findAll(empresaId: number): Promise<TributoTasaResponseDto[]> {
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
