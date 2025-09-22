import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteOrmEntity } from './infrastructure/persistence/cliente/ClienteOrmEntity';

import { ClienteRepositoryImpl } from './infrastructure/persistence/cliente/cliente.repository.impl';
import { ClienteController } from './adapter/web/controller/cliente.controller';
import { EmpresaOrmEntity } from './infrastructure/persistence/empresa/EmpresaOrmEntity';
import { CatalogoModule } from './catalogo.module';
import { ComprobanteOrmEntity } from './infrastructure/persistence/comprobante/ComprobanteOrmEntity';

@Module({
imports: [TypeOrmModule.forFeature([ClienteOrmEntity, EmpresaOrmEntity, ComprobanteOrmEntity]), CatalogoModule],
  controllers: [ClienteController],
  providers: [ClienteRepositoryImpl],
  exports: [ClienteRepositoryImpl],
})
export class ClienteModule {}
