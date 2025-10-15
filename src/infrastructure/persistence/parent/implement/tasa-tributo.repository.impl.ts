import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TributoTasaOrmEntity } from '../entity/tributo-tasa.orm.entity';
import { TributoTasaMapper } from 'src/domain/mapper/tributo-tasa.mapper';
import { ITributoTasaRepositoryPort } from 'src/domain/parent/tributo-tasa/port/tasa-tributo.repository.port';
import { TributoTasaResponseDto } from 'src/domain/parent/tributo-tasa/dto/response.tributo-tasa.dto';
import { CreateTributoTasaDto } from 'src/domain/parent/tributo-tasa/dto/create.tributo-tasa.dto';

@Injectable()
export class TributoTasaRepositoryImpl  implements ITributoTasaRepositoryPort {
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
