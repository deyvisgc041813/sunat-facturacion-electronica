import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateEmpresaUseCase } from './application/parent/empresa/create.empresa.usecase';
import { GetAllEmpresaUseCase } from './application/parent/empresa/get-all.empresa.usecase';
import { GetByIdEmpresaUseCase } from './application/parent/empresa/get-by-id.empresa.usecase';
import { GetByRucEmpresaUseCase } from './application/parent/empresa/get-by-ruc.empresa.usecase';
import { UpdateEmpresaUseCase } from './application/parent/empresa/update.empresa.usecase';
import { DeleteEmpresaUseCase } from './application/parent/empresa/delete.empresa.usecase';
import { UpdateStatusEmpresaUseCase } from './application/parent/empresa/update-status.empresa.usecase';
import { EmpresaOrmEntity } from './infrastructure/persistence/parent/entity/empesa.orm.entity';
import { ClienteOrmEntity } from './infrastructure/persistence/parent/entity/cliente.orm.entity';
import { ComprobanteOrmEntity } from './infrastructure/persistence/tenant/entity/comprobante/comprobante.orm.entity';
import { ProductoOrmEntity } from './infrastructure/persistence/tenant/entity/inventario/producto.orm.entity';
import { EmpresaRepositoryImpl } from './infrastructure/persistence/parent/implement/empresa.repository.impl';
import { EmpresaService } from './domain/parent/empresa/services/empresa.service';
import { AuditoriaService } from './domain/parent/core/logs/service/auditoria.logs.service';
import { EmpresaController } from './adapter/web/controller/parent/empresa.controller';
import { SucursalService } from './domain/parent/sucursal/service/sucursal.service';
import { TenantDatabaseService } from './domain/parent/conecciones-database/service/tenant-database.service';
import { AuthService } from './domain/auth/services/auth.service';
import { SucursalModule } from './sucursal.module';
import { TenantConeccionesModule } from './tenant-conecciones.module';
import { TenantContextModule } from './tenant-context.module';
import { AuthModule } from './auth.module';
import { CreateEmpresaBoardingUseCase } from './application/parent/empresa/create.empresa-boarding.usecase';
import { UbigeoService } from './domain/parent/ubigeo/services/ubigeo.service';
import { UbigeoModule } from './ubigeo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmpresaOrmEntity,
      ClienteOrmEntity,
      ComprobanteOrmEntity,
      ProductoOrmEntity,
    ]),
    SucursalModule,
    TenantConeccionesModule,
    TenantContextModule,
    AuthModule,
    UbigeoModule
  ],
  controllers: [EmpresaController],
  providers: [
    {
      provide: EmpresaService,

      useFactory: (
        empresaRepo: EmpresaRepositoryImpl,
        sucursalService: SucursalService,
        tenantDatabaseService: TenantDatabaseService,
        authService: AuthService,
        ubigeoService : UbigeoService,
        auditoriaService: AuditoriaService,

      ) =>
        new EmpresaService(
          empresaRepo,
          sucursalService,
          tenantDatabaseService,
          authService,
          ubigeoService,
          auditoriaService,
        ),
      inject: [
        EmpresaRepositoryImpl,
        SucursalService,
        TenantDatabaseService,
        AuthService,
        UbigeoService,
        AuditoriaService
      ],
    },
    // Casos de uso
    {
      provide: CreateEmpresaUseCase,
      useFactory: (empresaService: EmpresaService) =>
        new CreateEmpresaUseCase(empresaService),
      inject: [EmpresaService],
    },
    {
      provide: GetAllEmpresaUseCase,
      useFactory: (empresaService: EmpresaService) =>
        new GetAllEmpresaUseCase(empresaService),
      inject: [EmpresaService],
    },
    {
      provide: GetByIdEmpresaUseCase,
      useFactory: (empresaService: EmpresaService) =>
        new GetByIdEmpresaUseCase(empresaService),
      inject: [EmpresaService],
    },
    {
      provide: GetByRucEmpresaUseCase,
      useFactory: (empresaService: EmpresaService) =>
        new GetByRucEmpresaUseCase(empresaService),
      inject: [EmpresaService],
    },
    {
      provide: UpdateEmpresaUseCase,
      useFactory: (empresaService: EmpresaService) =>
        new UpdateEmpresaUseCase(empresaService),
      inject: [EmpresaService],
    },
    {
      provide: DeleteEmpresaUseCase,
      useFactory: (empresaService: EmpresaService) =>
        new DeleteEmpresaUseCase(empresaService),
      inject: [EmpresaService],
    },
    {
      provide: UpdateStatusEmpresaUseCase,
      useFactory: (empresaService: EmpresaService) =>
        new UpdateStatusEmpresaUseCase(empresaService),
      inject: [EmpresaService],
    },
    {
      provide: CreateEmpresaBoardingUseCase,
      useFactory: (empresaService: EmpresaService) =>
        new CreateEmpresaBoardingUseCase(empresaService),
      inject: [EmpresaService],
    },
    
    EmpresaRepositoryImpl,
  ],
  exports: [EmpresaRepositoryImpl],
})
export class EmpresaModule {}
