import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerieOrmEntity } from './infrastructure/database/entity/SerieOrmEntity';
import { SerieController } from './infrastructure/controllers/serie.controller';
import { SerieRepositoryImpl } from './infrastructure/database/repository/serie.repository.impl';
import { SerieAuditoriaModule } from './serie-auditoria.module';
import { CatalogoModule } from './catalogo.module';


@Module({
imports: [TypeOrmModule.forFeature([SerieOrmEntity]), SerieAuditoriaModule, CatalogoModule],
  controllers: [SerieController],
  providers: [SerieRepositoryImpl],
  exports: [SerieRepositoryImpl],
})
export class SerieModule {}
