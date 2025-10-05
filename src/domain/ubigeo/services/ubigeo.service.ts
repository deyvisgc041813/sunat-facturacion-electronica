import { Injectable } from '@nestjs/common';
import { UbigeoRepositoryImpl } from 'src/infrastructure/persistence/ubigeo/ubigeo.repository.impl';
import {
  DepartamentoResponseDto,
  DistritoResponseDto,
  ProvinciaResponseDto,
} from '../dto/ubigeo.response';

@Injectable()
export class UbigeoService {
  constructor(private readonly ubigeoRepo: UbigeoRepositoryImpl) {}

  async getDepartament(): Promise<DepartamentoResponseDto[]> {
    return await this.ubigeoRepo.getDepartament();
  }
  async getProvinceByDepartament(
    departamentoId: number,
  ): Promise<ProvinciaResponseDto[]> {
    return await this.ubigeoRepo.getProvinceByDepartament(departamentoId);
  }
   async getDistrictByProvince(
    provinciaId: number,
  ): Promise<DistritoResponseDto[]> {
    return await this.ubigeoRepo.getDistrictByProvince(provinciaId);
  }
}
