import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { User } from 'src/adapter/decorator/user.decorator';
import type { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { TenantGuard } from 'src/adapter/guards/tenant.guard';
import { CreateProductoUseCase } from 'src/application/tenant/Producto/CreateProductoUseCase';
import { FindAllProductoUseCase } from 'src/application/tenant/Producto/FindAllProductoUseCase';
import { FindByIdProductoUseCase } from 'src/application/tenant/Producto/FindByIdProductoUseCase';
import { UpdateProductoUseCase } from 'src/application/tenant/Producto/UpdateProductoUseCase';
import { CreateProductoDto } from 'src/domain/tenant/inventario/producto/dto/create.product.dto';
import { UpdateProductoDto } from 'src/domain/tenant/inventario/producto/dto/update.product.dto';
import { CatalogoRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/catalogo.repository.impl';

import { ProductoRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/inventario/producto.repository.impl';

@Controller('companies/branch/producto')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProductoController {
  constructor(private readonly productoRepo: ProductoRepositoryImpl, 
    private readonly catalogoRepository: CatalogoRepositoryImpl) {}

  @Post()
  async create(@Body() body: CreateProductoDto) {
    const useCase = new CreateProductoUseCase(this.productoRepo, this.catalogoRepository);
    return useCase.execute(body);
  }
  @Get()
  async findAll( @User() auth: IUserPayload) {
    const useCase = new FindAllProductoUseCase(this.productoRepo)
    return useCase.execute(auth?.sucursalActiva);
  }
  @Get(":id")
  async findById(@Param("id", ParseIntPipe) id:number, auth: IUserPayload) {
    const useCase = new FindByIdProductoUseCase(this.productoRepo)
    return useCase.execute(auth?.sucursalActiva, id);
  }
  @Put(":id")
  async update(@Param("id", ParseIntPipe) clienteId:number, @Body() body: UpdateProductoDto, auth: IUserPayload) {
    const useCase = new UpdateProductoUseCase(this.productoRepo, this.catalogoRepository)
    return useCase.execute(auth?.sucursalActiva, body, clienteId);
  }
}
