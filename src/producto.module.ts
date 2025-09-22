import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresaOrmEntity } from './infrastructure/persistence/empresa/EmpresaOrmEntity';
import { ProductoController } from './adapter/web/controller/producto.controller';
import { ProductoRepositoryImpl } from './infrastructure/persistence/producto/producto.repository.impl';
import { CatalogoModule } from './catalogo.module';
import { ProductoOrmEntity } from './infrastructure/persistence/producto/ProductoOrmEntity';

@Module({
imports: [TypeOrmModule.forFeature([ProductoOrmEntity, EmpresaOrmEntity]), CatalogoModule],
  controllers: [ProductoController],
  providers: [ProductoRepositoryImpl],
  exports: [ProductoRepositoryImpl],
})
export class ProductoModule {}
