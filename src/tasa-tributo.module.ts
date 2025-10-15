import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TributoTasaOrmEntity } from './infrastructure/persistence/parent/entity/tributo-tasa.orm.entity';
import { TributoTasaRepositoryImpl } from './infrastructure/persistence/parent/implement/tasa-tributo.repository.impl';

@Module({
  imports: [TypeOrmModule.forFeature([TributoTasaOrmEntity])],
  providers: [TributoTasaRepositoryImpl],
  exports: [TributoTasaRepositoryImpl],
})
export class TasaTributoModule {}
