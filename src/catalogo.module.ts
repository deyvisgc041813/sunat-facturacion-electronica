import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoTipoOrmEnity } from './infrastructure/database/entity/CatalogoTipoOrmEnity';
import { CatalogoDetalleOrmEnity } from './infrastructure/database/entity/CatalogoDetalleOrmEnity';
import { CatalogoRepositoryImpl } from './infrastructure/database/repository/catalogo.repository.impl';

@Module({
imports: [TypeOrmModule.forFeature([CatalogoTipoOrmEnity, CatalogoDetalleOrmEnity])],
  controllers: [],
  providers: [CatalogoRepositoryImpl],
  exports: [CatalogoRepositoryImpl],
})
export class CatalogoModule {}
