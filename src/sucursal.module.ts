import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresaOrmEntity } from './infrastructure/persistence/empresa/EmpresaOrmEntity';
import { ComprobanteOrmEntity } from './infrastructure/persistence/comprobante/ComprobanteOrmEntity';
import { SucursalOrmEntity } from './infrastructure/persistence/sucursal/SucursalOrmEntity';
import { SucursalRepositoryImpl } from './infrastructure/persistence/sucursal/sucursal.repository.impl';
import { SucursalController } from './adapter/web/controller/sucursal.controller';

@Module({
imports: [TypeOrmModule.forFeature([EmpresaOrmEntity, ComprobanteOrmEntity, SucursalOrmEntity])],
  controllers: [SucursalController],
  providers: [SucursalRepositoryImpl],
  exports: [SucursalRepositoryImpl],
})
export class SucursalModule {}
