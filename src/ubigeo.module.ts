import { Module } from '@nestjs/common';
import { DepartamentoOrmEntity } from './infrastructure/persistence/parent/entity/ubigeo/departamento.orm.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DistritoOrmEntity } from './infrastructure/persistence/parent/entity/ubigeo/distrito.orm.entity';
import { UbigeoRepositoryImpl } from './infrastructure/persistence/parent/implement/ubigeo.repository.impl';
import { GetDepartamentUseCase } from './application/parent/ubigeo/get-departament.usecase';
import { GetProvinceUseCase } from './application/parent/ubigeo/get-province.usecase';
import { GetDistrictUseCase } from './application/parent/ubigeo/get-district.usecase';
import { UbigeoController } from './adapter/web/controller/parent/ubigeo.controller';
import { ProvinciaOrmEntity } from './infrastructure/persistence/parent/entity/ubigeo/provincia.orm.entity';
import { UbigeoService } from './domain/parent/ubigeo/services/ubigeo.service';

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
