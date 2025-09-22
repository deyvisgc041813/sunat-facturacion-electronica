import { Module } from '@nestjs/common';
import { SerieAuditoriaOrmEntity } from './infrastructure/persistence/serie-log/SerieAuditoriaOrmEntity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerieAuditoriaRepositoryImpl } from './infrastructure/persistence/serie-log/serie-auditoria.repository.impl';
import { UsuariosOrmEntity } from './infrastructure/persistence/usuario/UsuariosOrmEntity';

@Module({
imports: [TypeOrmModule.forFeature([SerieAuditoriaOrmEntity, UsuariosOrmEntity])],
  controllers: [],
  providers: [SerieAuditoriaRepositoryImpl],
  exports: [TypeOrmModule, SerieAuditoriaRepositoryImpl],
})
export class SerieAuditoriaModule {}
