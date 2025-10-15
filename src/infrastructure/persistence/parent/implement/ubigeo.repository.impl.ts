import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartamentoOrmEntity } from '../entity/ubigeo/departamento.orm.entity';
import { DistritoOrmEntity } from '../entity/ubigeo/distrito.orm.entity';
import { UbigeoMapper } from 'src/domain/mapper/ubigeo.maper';
import { ProvinciaOrmEntity } from '../entity/ubigeo/provincia.orm.entity';
import { IUbigeoRepositoryPort } from 'src/domain/parent/ubigeo/ports/ubigeo.repository';
import { DepartamentoResponseDto, DistritoResponseDto, ProvinciaResponseDto } from 'src/domain/parent/ubigeo/dto/ubigeo.response';

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
  async getDistrictById(distritoId: number): Promise<DistritoResponseDto | null> {
    const result = await this.repoDist.findOne({
      where: {distritoId}
    });
    if(!result) {
      throw new NotFoundException( `No existe informacion con el Id distrito ${distritoId}` )
    }
    return UbigeoMapper.toDomainDistrict(result);
  }
}
