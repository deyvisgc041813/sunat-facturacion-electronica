import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerieController } from './adapter/web/controller/serie.controller';
import { SerieRepositoryImpl } from './infrastructure/persistence/serie/serie.repository.impl';
import { SerieAuditoriaModule } from './serie-auditoria.module';
import { CatalogoModule } from './catalogo.module';
import { SerieOrmEntity } from './infrastructure/persistence/serie/SerieOrmEntity';


@Module({
imports: [TypeOrmModule.forFeature([SerieOrmEntity]), SerieAuditoriaModule, CatalogoModule],
  controllers: [SerieController],
  providers: [SerieRepositoryImpl],
  exports: [SerieRepositoryImpl],
})
export class SerieModule {}
