import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoTipoOrmEnity } from './infrastructure/persistence/parent/entity/catalogo/catalogo-tipo.orm.entity';
import { CatalogoDetalleOrmEnity } from './infrastructure/persistence/parent/entity/catalogo/catalogo-detalle.orm.entity';
import { CatalogoRepositoryImpl } from './infrastructure/persistence/parent/implement/catalogo.repository.impl';

@Module({
imports: [TypeOrmModule.forFeature([CatalogoTipoOrmEnity, CatalogoDetalleOrmEnity])],
  controllers: [],
  providers: [CatalogoRepositoryImpl],
  exports: [CatalogoRepositoryImpl],
})
export class CatalogoModule {}
