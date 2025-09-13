import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteOrmEntity } from './infrastructure/database/entity/ClienteOrmEntity';
import { EmpresaOrmEntity } from './infrastructure/database/entity/EmpresaOrmEntity';
import { ProductoOrmEntity } from './infrastructure/database/entity/ProductoOrmEntity';
import { EmpresaRepositoryImpl } from './infrastructure/database/repository/empresa.repository.impl';
import { EmpresaController } from './infrastructure/controllers/empresa.controller';
import { ComprobanteOrmEntity } from './infrastructure/database/entity/ComprobanteOrmEntity';

@Module({
imports: [TypeOrmModule.forFeature([EmpresaOrmEntity, ClienteOrmEntity, ComprobanteOrmEntity, ProductoOrmEntity])],
  controllers: [EmpresaController],
  providers: [EmpresaRepositoryImpl],
  exports: [EmpresaRepositoryImpl],
})
export class EmpresaModule {}
