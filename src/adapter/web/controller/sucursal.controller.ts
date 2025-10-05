import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { User } from 'src/adapter/decorator/user.decorator';
import type { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { CreateSucursalUseCase } from 'src/application/sucursal/create.sucursal.usecase';
import { GetSucursalByEmpresaIdUseCase } from 'src/application/sucursal/get-sucursal-by-empresa.usecase';
import { GetSucursalByEmpresaUseCase } from 'src/application/sucursal/get-sucursales-by-empresa.usecase';
import { CreateSucursalDto } from 'src/domain/sucursal/dto/create.request.dto';
@Controller('v1/companies/branch')
@UseGuards(JwtAuthGuard)
export class SucursalController {
  constructor(private readonly createUseCase: CreateSucursalUseCase,
    private readonly getUseCase: GetSucursalByEmpresaUseCase,
        private readonly getByIdUseCase: GetSucursalByEmpresaIdUseCase
  ) {}
  @Post()
  async create(@Body() body: CreateSucursalDto, @User() auth: IUserPayload) {
    return this.createUseCase.execute(body, auth);
  }
  @Get()
  async getAll(@User() auth: IUserPayload) {
    return this.getUseCase.execute(auth.empresaId ?? 0)
  }
  @Get(":id")
  async findById(@Param("id", ParseIntPipe) id:number, @User() auth: IUserPayload) {
    return this.getByIdUseCase.execute(id, auth.empresaId ?? 0);
  }
  // @Put(":id")
  // async update(@Param("id", ParseIntPipe) clienteId:number, @Body() body: UpdateClienteDto) {
  //   const useCase = new UpdateClienteUseCase(this.clienteRepo, this.catalogoRepository)
  //   const empresaId = 18
  //   return useCase.execute(body, clienteId, empresaId);
  // }
}
