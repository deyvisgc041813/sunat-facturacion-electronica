import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductoController } from './adapter/web/controller/tenant/producto.controller';
import { ProductoRepositoryImpl } from './infrastructure/persistence/tenant/implement/inventario/producto.repository.impl';
import { CatalogoModule } from './catalogo.module';
import { ProductoOrmEntity } from './infrastructure/persistence/tenant/entity/inventario/producto.orm.entity';
import { TenantConeccionesModule } from './tenant-conecciones.module';
import { EmpresaOrmEntity } from './infrastructure/persistence/parent/entity/empresa/empesa.orm.entity';

@Module({
imports: [TypeOrmModule.forFeature([ProductoOrmEntity, EmpresaOrmEntity]), CatalogoModule, TenantConeccionesModule],
  controllers: [ProductoController],
  providers: [ProductoRepositoryImpl],
  exports: [ProductoRepositoryImpl],
})
export class ProductoModule {}
