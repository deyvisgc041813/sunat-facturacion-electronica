import { Module } from '@nestjs/common';
import { SerieAuditoriaOrmEntity } from './infrastructure/database/entity/SerieAuditoriaOrmEntity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerieAuditoriaRepositoryImpl } from './infrastructure/database/repository/serie-auditoria.repository.impl';
import { UsuariosOrmEntity } from './infrastructure/database/entity/UsuariosOrmEntity';

@Module({
imports: [TypeOrmModule.forFeature([SerieAuditoriaOrmEntity, UsuariosOrmEntity])],
  controllers: [],
  providers: [SerieAuditoriaRepositoryImpl],
  exports: [TypeOrmModule, SerieAuditoriaRepositoryImpl],
})
export class SerieAuditoriaModule {}
