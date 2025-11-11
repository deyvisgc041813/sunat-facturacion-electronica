import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SucursalRepositoryImpl } from './infrastructure/persistence/parent/implement/sucursal.repository.impl';
import { SucursalController } from './adapter/web/controller/parent/sucursal.controller';
import { UbigeoModule } from './ubigeo.module';
import { CreateSucursalUseCase } from './application/parent/sucursal/create.sucursal.usecase';
import { GetSucursalByEmpresaUseCase } from './application/parent/sucursal/get-sucursales-by-empresa.usecase';
import { GetSucursalByEmpresaIdUseCase } from './application/parent/sucursal/get-sucursal-by-empresa.usecase';
import { UpdateSucursalUseCase } from './application/parent/sucursal/update.sucursal.usecase';
import { DeleteSucursalUseCase } from './application/parent/sucursal/delete.sucursal.usecase';
import { BranchStatusSucursalUseCase } from './application/parent/sucursal/update-status.sucursal.usecase';
import { ComprobanteOrmEntity } from './infrastructure/persistence/tenant/entity/comprobante/comprobante.orm.entity';
import { SucursalOrmEntity } from './infrastructure/persistence/parent/entity/sucursal.orm.entity';
import { SucursalService } from './domain/parent/sucursal/service/sucursal.service';
import { AuditoriaService } from './domain/parent/core/logs/service/auditoria.logs.service';
import { BranchBillingActivateSucursalUseCase } from './application/parent/sucursal/branch-billing.activate.usecase';
import { TenantDatabaseService } from './domain/parent/conecciones-database/service/tenant-database.service';
import { TenantConeccionesModule } from './tenant-conecciones.module';
import { AuditoriaLogsRepositoryImpl } from './infrastructure/persistence/parent/implement/auditoria-log.repository';
import { TenantConnectionRepositoryImpl } from './infrastructure/persistence/parent/implement/coneccion-database.repository.impl';
import { TenantConnectionOrmEntity } from './infrastructure/persistence/parent/entity/tenant.coneccion.orm.entity';
import { EmpresaOrmEntity } from './infrastructure/persistence/parent/entity/empresa/empesa.orm.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmpresaOrmEntity,
      ComprobanteOrmEntity,
      SucursalOrmEntity,
      TenantConnectionOrmEntity
    ]),
    UbigeoModule,
    TenantConeccionesModule,
  ],
  controllers: [SucursalController],
  providers: [
    // Servicios principales
    SucursalService,
    SucursalRepositoryImpl,
    AuditoriaService,
    TenantDatabaseService,
    //DataSource,

    // Casos de uso
    CreateSucursalUseCase,
    GetSucursalByEmpresaUseCase,
    GetSucursalByEmpresaIdUseCase,
    UpdateSucursalUseCase,
    DeleteSucursalUseCase,
    BranchStatusSucursalUseCase,
    BranchBillingActivateSucursalUseCase,
    AuditoriaLogsRepositoryImpl,
    TenantConnectionRepositoryImpl,
    
  ],
  exports: [
    SucursalService,
    SucursalRepositoryImpl,
  ],
})
export class SucursalModule {}
