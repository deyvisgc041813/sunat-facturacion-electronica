import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TributoTasaOrmEntity } from './infrastructure/persistence/tasa-tributo/TributoTasaOrmEntity';
import { TributoTasaRepositoryImpl } from './infrastructure/persistence/tasa-tributo/tasa-tributo.repository.impl';

@Module({
  imports: [TypeOrmModule.forFeature([TributoTasaOrmEntity])],
  providers: [TributoTasaRepositoryImpl],
  exports: [TributoTasaRepositoryImpl],
})
export class TasaTributoModule {}
