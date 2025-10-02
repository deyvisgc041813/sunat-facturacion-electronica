import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { CreateProductoUseCase } from 'src/application/Producto/CreateProductoUseCase';
import { FindAllProductoUseCase } from 'src/application/Producto/FindAllProductoUseCase';
import { FindByIdProductoUseCase } from 'src/application/Producto/FindByIdProductoUseCase';
import { UpdateProductoUseCase } from 'src/application/Producto/UpdateProductoUseCase';
import { CreateProductoDto } from 'src/domain/productos/dto/CreateProductoDto';
import { UpdateProductoDto } from 'src/domain/productos/dto/UpdateProductoDto';
import { CatalogoRepositoryImpl } from 'src/infrastructure/persistence/catalogo/catalogo.repository.impl';

import { ProductoRepositoryImpl } from 'src/infrastructure/persistence/producto/producto.repository.impl';

@Controller('producto')
@UseGuards(JwtAuthGuard)
export class ProductoController {
  constructor(private readonly productoRepo: ProductoRepositoryImpl, private readonly catalogoRepository: CatalogoRepositoryImpl) {}

  @Post()
  async create(@Body() body: CreateProductoDto) {
    const useCase = new CreateProductoUseCase(this.productoRepo, this.catalogoRepository);
    return useCase.execute(body);
  }
  @Get()
  async findAll() {
    const useCase = new FindAllProductoUseCase(this.productoRepo)
    return useCase.execute();
  }
  @Get(":id")
  async findById(@Param("id", ParseIntPipe) id:number) {
    const useCase = new FindByIdProductoUseCase(this.productoRepo)
    return useCase.execute(id);
  }
  @Put(":id")
  async update(@Param("id", ParseIntPipe) clienteId:number, @Body() body: UpdateProductoDto) {
    const useCase = new UpdateProductoUseCase(this.productoRepo, this.catalogoRepository)
    return useCase.execute(body, clienteId);
  }
}
