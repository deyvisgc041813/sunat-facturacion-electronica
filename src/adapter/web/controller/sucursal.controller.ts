import { Body, Controller, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { CreateClienteDto } from 'src/domain/cliente/dto/CreateRequestDto';
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/sucursal/sucursal.repository.impl';

@Controller('sucursal')
export class SucursalController {
  constructor(private readonly sucursalRepo: SucursalRepositoryImpl) {}

  @Post()
  async create(@Body() body: CreateClienteDto) {
    //const useCase = new CreateClienteUseCase(this.clienteRepo, this.catalogoRepository);
    //return useCase.execute(body);
  }
  // @Get()
  // async findAll() {
  //   const useCase = new FindAllClienteUseCase(this.clienteRepo)
  //   return useCase.execute();
  // }
  // @Get(":id")
  // async findById(@Param("id", ParseIntPipe) id:number) {
  //   const empresaId = 18
  //   const useCase = new FindByIdClienteUseCase(this.clienteRepo)
  //   return useCase.execute(id, empresaId);
  // }
  // @Put(":id")
  // async update(@Param("id", ParseIntPipe) clienteId:number, @Body() body: UpdateClienteDto) {
  //   const useCase = new UpdateClienteUseCase(this.clienteRepo, this.catalogoRepository)
  //   const empresaId = 18
  //   return useCase.execute(body, clienteId, empresaId);
  // }
}
