import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { User } from 'src/adapter/decorator/user.decorator';
import type { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { TenantGuard } from 'src/adapter/guards/tenant.guard';
import { CreateClientUseCase } from 'src/application/parent/cliente/create.client.usecase.ts';
import { DeleteClientUseCase } from 'src/application/parent/cliente/delete.client.usecase';
import { GetAllClientUseCase } from 'src/application/parent/cliente/get-all.client.usecase';
import { GetByIdClientUseCase } from 'src/application/parent/cliente/get-by-id.client.usecase';
import { GetByNumDocClientUseCase } from 'src/application/parent/cliente/get-by-num-doc.usecase';
import { UpdateStatusClientUseCase } from 'src/application/parent/cliente/update-status.client.usecase';
import { UpdateClientUseCase } from 'src/application/parent/cliente/update.cliente.usecase';
import { CreateClienteDto } from 'src/domain/parent/cliente/dto/create.client.dto';
import { UpdateClienteDto } from 'src/domain/parent/cliente/dto/update.client.dto';

@Controller('companies/client')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ClienteController {
  constructor(
    private readonly createUseCase: CreateClientUseCase,
    private readonly getAllUseCase: GetAllClientUseCase,
    private readonly getByIdUseCase: GetByIdClientUseCase,
    private readonly GetByNumDocUseCase: GetByNumDocClientUseCase,
    private readonly deleteUseCase: DeleteClientUseCase,
    private readonly updateStatusUseCase: UpdateStatusClientUseCase,
    private readonly updateUseCase: UpdateClientUseCase,
  ) {}

  @Post()
  async create(@Body() body: CreateClienteDto, @User() auth: IUserPayload) {
    return this.createUseCase.execute(body, auth);
  }
  @Get()
  async findAll(@User() auth: IUserPayload) {
    return this.getAllUseCase.execute(auth);
  }
  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @User() auth: IUserPayload,
  ) {
    return this.getByIdUseCase.execute(auth.empresaId ?? 0, id);
  }
  @Get(':numDocumento')
  async findByNumDocumento(
    @Param('numDocumento') numDocumento: string,
    @User() auth: IUserPayload,
  ) {
    return this.GetByNumDocUseCase.execute(auth.empresaId ?? 0, numDocumento);
  }
  @Delete(':id')
  async deleteSucursal(
    @Param('id') id: number,
    @User() auth: IUserPayload,
  ): Promise<any> {
    return await this.deleteUseCase.execute(id, auth);
  }
  @Patch(':id/status/:estado')
  async toggleBranchStatus(
    @Param('id') id: number,
    @Param('estado') estado: string,
    @User() auth: IUserPayload,
  ) {
    return await this.updateStatusUseCase.execute(id, estado, auth);
  }
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) clienteId: number,
    @Body() body: UpdateClienteDto,
    @User() auth: IUserPayload,
  ) {
    return this.updateUseCase.execute(body, clienteId, auth);
  }
}
