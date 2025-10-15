import { Module } from '@nestjs/common';
import { SerieAuditoriaOrmEntity } from './infrastructure/persistence/tenant/entity/serie-comprobante/serie-auditoria.orm.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerieAuditoriaRepositoryImpl } from './infrastructure/persistence/tenant/implement/auditoria/serie-auditoria.repository.impl';
import { UsuariosOrmEntity } from './infrastructure/persistence/auth/usuario.orm.entity';
import { TenantConeccionesModule } from './tenant-conecciones.module';

@Module({
imports: [TypeOrmModule.forFeature([SerieAuditoriaOrmEntity, UsuariosOrmEntity]), TenantConeccionesModule],
  controllers: [],
  providers: [SerieAuditoriaRepositoryImpl],
  exports: [TypeOrmModule, SerieAuditoriaRepositoryImpl],
})
export class SerieAuditoriaModule {}
