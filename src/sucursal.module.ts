import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresaOrmEntity } from './infrastructure/persistence/empresa/EmpresaOrmEntity';
import { ComprobanteOrmEntity } from './infrastructure/persistence/comprobante/ComprobanteOrmEntity';
import { SucursalOrmEntity } from './infrastructure/persistence/sucursal/SucursalOrmEntity';
import { SucursalRepositoryImpl } from './infrastructure/persistence/sucursal/sucursal.repository.impl';
import { SucursalController } from './adapter/web/controller/sucursal.controller';
import { UbigeoModule } from './ubigeo.module';
import { SucursalService } from './domain/sucursal/service/sucursal.service';
import { CreateSucursalUseCase } from './application/sucursal/create.sucursal.usecase';
import { GetSucursalByEmpresaUseCase } from './application/sucursal/get-sucursales-by-empresa.usecase';
import { GetSucursalByEmpresaIdUseCase } from './application/sucursal/get-sucursal-by-empresa.usecase';

@Module({
  imports: [TypeOrmModule.forFeature([EmpresaOrmEntity, ComprobanteOrmEntity, SucursalOrmEntity]), UbigeoModule],
  controllers: [SucursalController],
  providers: [
    {
      provide: SucursalService,
      useFactory: (sucuralRepo: SucursalRepositoryImpl) =>
        new SucursalService(sucuralRepo),
      inject: [SucursalRepositoryImpl],
    },

    // Casos de uso
    {
      provide: CreateSucursalUseCase,
      useFactory: (sucuralService: SucursalService) =>
        new CreateSucursalUseCase(sucuralService),
      inject: [SucursalService],
    },
    {
      provide: GetSucursalByEmpresaUseCase,
      useFactory: (sucuralService: SucursalService) =>
        new GetSucursalByEmpresaUseCase(sucuralService),
      inject: [SucursalService],
    },
      {
      provide: GetSucursalByEmpresaIdUseCase,
      useFactory: (sucuralService: SucursalService) =>
        new GetSucursalByEmpresaIdUseCase(sucuralService),
      inject: [SucursalService],
    },
    SucursalRepositoryImpl,
  ],
  exports: [
    SucursalService
  ],
})


export class SucursalModule {}
