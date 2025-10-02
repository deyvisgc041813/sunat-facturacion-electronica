import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { CreateClienteUseCase } from 'src/application/Cliente/CreateClienteUseCase';
import { FindAllClienteUseCase } from 'src/application/Cliente/FindAllClienteUseCase';
import { FindByIdClienteUseCase } from 'src/application/Cliente/FindByIdClienteUseCase';
import { UpdateClienteUseCase } from 'src/application/Cliente/UpdateClienteUseCase';
import { CreateClienteDto } from 'src/domain/cliente/dto/CreateRequestDto';
import { UpdateClienteDto } from 'src/domain/cliente/dto/UpdateClienteDto';
import { CatalogoRepositoryImpl } from 'src/infrastructure/persistence/catalogo/catalogo.repository.impl';

import { ClienteRepositoryImpl } from 'src/infrastructure/persistence/cliente/cliente.repository.impl';

@Controller('cliente')
@UseGuards(JwtAuthGuard)
export class ClienteController {
  constructor(private readonly clienteRepo: ClienteRepositoryImpl, private readonly catalogoRepository: CatalogoRepositoryImpl) {}

  @Post()
  async create(@Body() body: CreateClienteDto) {
    const useCase = new CreateClienteUseCase(this.clienteRepo, this.catalogoRepository);
    return useCase.execute(body);
  }
  @Get()
  async findAll() {
    const useCase = new FindAllClienteUseCase(this.clienteRepo)
    return useCase.execute();
  }
  @Get(":id")
  async findById(@Param("id", ParseIntPipe) id:number) {
    const empresaId = 18
    const useCase = new FindByIdClienteUseCase(this.clienteRepo)
    return useCase.execute(id, empresaId);
  }
  @Put(":id")
  async update(@Param("id", ParseIntPipe) clienteId:number, @Body() body: UpdateClienteDto) {
    const useCase = new UpdateClienteUseCase(this.clienteRepo, this.catalogoRepository)
    const empresaId = 18
    return useCase.execute(body, clienteId, empresaId);
  }
}
