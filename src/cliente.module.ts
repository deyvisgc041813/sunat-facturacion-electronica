import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteOrmEntity } from './infrastructure/database/entity/ClienteOrmEntity';

import { ClienteRepositoryImpl } from './infrastructure/database/repository/cliente.repository.impl';
import { ClienteController } from './infrastructure/controllers/cliente/cliente.controller';
import { EmpresaOrmEntity } from './infrastructure/database/entity/EmpresaOrmEntity';
import { CatalogoModule } from './catalogo.module';
import { ComprobanteOrmEntity } from './infrastructure/database/entity/ComprobanteOrmEntity';

@Module({
imports: [TypeOrmModule.forFeature([ClienteOrmEntity, EmpresaOrmEntity, ComprobanteOrmEntity]), CatalogoModule],
  controllers: [ClienteController],
  providers: [ClienteRepositoryImpl],
  exports: [ClienteRepositoryImpl],
})
export class ClienteModule {}
