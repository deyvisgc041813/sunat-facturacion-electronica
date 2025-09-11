import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductoOrmEntity } from './infrastructure/database/entity/ProductoOrmEntity';
import { EmpresaOrmEntity } from './infrastructure/database/entity/EmpresaOrmEntity';
import { ProductoController } from './infrastructure/controllers/producto/producto.controller';
import { ProductoRepositoryImpl } from './infrastructure/database/repository/producto.repository.impl';
import { CatalogoModule } from './catalogo.module';

@Module({
imports: [TypeOrmModule.forFeature([ProductoOrmEntity, EmpresaOrmEntity]), CatalogoModule],
  controllers: [ProductoController],
  providers: [ProductoRepositoryImpl],
  exports: [ProductoRepositoryImpl],
})
export class ProductoModule {}
