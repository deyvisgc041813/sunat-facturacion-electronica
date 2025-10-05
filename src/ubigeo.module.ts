import { Module } from '@nestjs/common';
import { DepartamentoOrmEntity } from './infrastructure/persistence/ubigeo/departamento.orm.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProvinciaOrmEntity } from './infrastructure/persistence/ubigeo/provincia.orm.entity copy';
import { DistritoOrmEntity } from './infrastructure/persistence/ubigeo/distrito.orm.entity';
import { UbigeoService } from './domain/ubigeo/services/ubigeo.service';
import { UbigeoRepositoryImpl } from './infrastructure/persistence/ubigeo/ubigeo.repository.impl';
import { GetDepartamentUseCase } from './application/ubigeo/get-departament.usecase';
import { GetProvinceUseCase } from './application/ubigeo/get-province.usecase';
import { GetDistrictUseCase } from './application/ubigeo/get-district.usecase';
import { UbigeoController } from './adapter/web/controller/ubigeo.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DepartamentoOrmEntity,
      ProvinciaOrmEntity,
      DistritoOrmEntity,
    ]),
  ],
  controllers: [UbigeoController],
  providers: [
    {
      provide: UbigeoService,
      useFactory: (ubigeoRepo: UbigeoRepositoryImpl) =>
        new UbigeoService(ubigeoRepo),
      inject: [UbigeoRepositoryImpl],
    },

    // Casos de uso
    {
      provide: GetDepartamentUseCase,
      useFactory: (ubigeoService: UbigeoService) =>
        new GetDepartamentUseCase(ubigeoService),
      inject: [UbigeoService],
    },
    {
      provide: GetProvinceUseCase,
      useFactory: (ubigeoService: UbigeoService) =>
        new GetProvinceUseCase(ubigeoService),
      inject: [UbigeoService],
    },
    {
      provide: GetDistrictUseCase,
      useFactory: (ubigeoService: UbigeoService) =>
        new GetDistrictUseCase(ubigeoService),
      inject: [UbigeoService],
    },
    UbigeoRepositoryImpl,
  ],
  exports: [
    UbigeoService
  ],
})
export class UbigeoModule {}
