import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoTipoOrmEnity } from './infrastructure/persistence/catalogo/CatalogoTipoOrmEnity';
import { CatalogoDetalleOrmEnity } from './infrastructure/persistence/catalogo/CatalogoDetalleOrmEnity';
import { CatalogoRepositoryImpl } from './infrastructure/persistence/catalogo/catalogo.repository.impl';

@Module({
imports: [TypeOrmModule.forFeature([CatalogoTipoOrmEnity, CatalogoDetalleOrmEnity])],
  controllers: [],
  providers: [CatalogoRepositoryImpl],
  exports: [CatalogoRepositoryImpl],
})
export class CatalogoModule {}
