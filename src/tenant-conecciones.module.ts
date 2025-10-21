import { Module } from '@nestjs/common';
import { TenantConnectionOrmEntity } from './infrastructure/persistence/parent/entity/tenant.coneccion.orm.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantDatabaseService } from './domain/parent/conecciones-database/service/tenant-database.service';
import { TenantConnectionRepositoryImpl } from './infrastructure/persistence/parent/implement/coneccion-database.repository.impl';
import { TenantRepositoryHelper } from './domain/parent/conecciones-database/service/tenant-repository.helper';
import { TenantContextService } from './domain/parent/conecciones-database/service/tenant-context.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantConnectionOrmEntity])
  ],
  controllers: [],
  providers: [
    {
      provide: TenantDatabaseService,
      useFactory: (tenantRepo: TenantConnectionRepositoryImpl) =>
        new TenantDatabaseService(tenantRepo),
      inject: [TenantConnectionRepositoryImpl],
    },
    {
      provide: TenantRepositoryHelper,
      useFactory: (tenantService: TenantDatabaseService) =>
        new TenantRepositoryHelper(tenantService),
      inject: [TenantDatabaseService],
    },
     
    TenantConnectionRepositoryImpl,
  ],
  exports: [TenantDatabaseService, TenantRepositoryHelper,],
})
export class TenantConeccionesModule {}
