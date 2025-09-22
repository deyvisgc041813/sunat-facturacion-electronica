import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteOrmEntity } from './infrastructure/persistence/cliente/ClienteOrmEntity';
import { EmpresaOrmEntity } from './infrastructure/persistence/empresa/EmpresaOrmEntity';
import { EmpresaRepositoryImpl } from './infrastructure/persistence/empresa/empresa.repository.impl';
import { ComprobanteOrmEntity } from './infrastructure/persistence/comprobante/ComprobanteOrmEntity';
import { EmpresaController } from './adapter/web/controller/empresa.controller';
import { ProductoOrmEntity } from './infrastructure/persistence/producto/ProductoOrmEntity';

@Module({
imports: [TypeOrmModule.forFeature([EmpresaOrmEntity, ClienteOrmEntity, ComprobanteOrmEntity, ProductoOrmEntity])],
  controllers: [EmpresaController],
  providers: [EmpresaRepositoryImpl],
  exports: [EmpresaRepositoryImpl],
})
export class EmpresaModule {}
