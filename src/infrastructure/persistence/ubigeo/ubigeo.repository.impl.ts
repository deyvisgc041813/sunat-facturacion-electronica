import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUbigeoRepositoryPort } from 'src/domain/ubigeo/ports/ubigeo.repository';
import { DepartamentoResponseDto, ProvinciaResponseDto, DistritoResponseDto } from 'src/domain/ubigeo/dto/ubigeo.response';
import { DepartamentoOrmEntity } from './departamento.orm.entity';
import { ProvinciaOrmEntity } from './provincia.orm.entity copy';
import { DistritoOrmEntity } from './distrito.orm.entity';
import { UbigeoMapper } from 'src/domain/mapper/ubigeo.maper';

@Injectable()
export class UbigeoRepositoryImpl implements IUbigeoRepositoryPort {
  constructor(
    @InjectRepository(DepartamentoOrmEntity)
    private readonly repoDepar: Repository<DepartamentoOrmEntity>,
    @InjectRepository(ProvinciaOrmEntity)
    private readonly repoProv: Repository<ProvinciaOrmEntity>,
    @InjectRepository(DistritoOrmEntity)
    private readonly repoDist: Repository<DistritoOrmEntity>,
  ) {}
  async getDepartament(): Promise<DepartamentoResponseDto[]> {
    const result = await this.repoDepar.find({
      relations: ['provincia', 'provincia.distrito'],
    });
    return result.map((d) => UbigeoMapper.toDomainDepartament(d));
  }
  async getProvinceByDepartament(departamentoId: number): Promise<ProvinciaResponseDto[]> {
    const result = await this.repoProv.find({
      where: {departamento: {departamentoId}},
      relations: ['distrito'],
    });
    return result.map((dep) => UbigeoMapper.toDomainPronvince(dep));
  }
 async getDistrictByProvince(provinciaId: number): Promise<DistritoResponseDto[]> {
    const result = await this.repoDist.find({
      where: {provincia: {provinciaId}}
    });
    return result.map((dis) => UbigeoMapper.toDomainDistrict(dis));
  }
}
