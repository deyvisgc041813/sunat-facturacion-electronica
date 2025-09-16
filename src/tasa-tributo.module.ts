import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TributoTasaOrmEntity } from './infrastructure/database/entity/TributoTasaOrmEntity';
import { TributoTasaRepositoryImpl } from './infrastructure/database/repository/tasa-tributo.repository.impl';

@Module({
  imports: [TypeOrmModule.forFeature([TributoTasaOrmEntity])],
  providers: [TributoTasaRepositoryImpl],
  exports: [TributoTasaRepositoryImpl],
})
export class TasaTributoModule {}
