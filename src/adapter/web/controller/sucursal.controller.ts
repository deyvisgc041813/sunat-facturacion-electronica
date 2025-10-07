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
import { CreateSucursalUseCase } from 'src/application/sucursal/create.sucursal.usecase';
import { DeleteSucursalUseCase } from 'src/application/sucursal/delete.sucursal.usecase';
import { GetSucursalByEmpresaIdUseCase } from 'src/application/sucursal/get-sucursal-by-empresa.usecase';
import { GetSucursalByEmpresaUseCase } from 'src/application/sucursal/get-sucursales-by-empresa.usecase';
import { BranchStatusSucursalUseCase } from 'src/application/sucursal/update-status.sucursal.usecase';
import { UpdateSucursalUseCase } from 'src/application/sucursal/update.sucursal.usecase';
import { CreateSucursalDto } from 'src/domain/sucursal/dto/create.request.dto';
import { UpdateSucursalDto } from 'src/domain/sucursal/dto/update.request.dto';
@Controller('v1/companies/branch')
@UseGuards(JwtAuthGuard)
export class SucursalController {
  constructor(
    private readonly createUseCase: CreateSucursalUseCase,
    private readonly getUseCase: GetSucursalByEmpresaUseCase,
    private readonly getByIdUseCase: GetSucursalByEmpresaIdUseCase,
    private readonly updateUseCase: UpdateSucursalUseCase,
    private readonly deleteUseCase: DeleteSucursalUseCase,
    private readonly branchStatusUseCase: BranchStatusSucursalUseCase
  ) {}
  @Post()
  async create(@Body() body: CreateSucursalDto, @User() auth: IUserPayload) {
    return this.createUseCase.execute(body, auth);
  }
  @Get()
  async getAll(@User() auth: IUserPayload) {
    return this.getUseCase.execute(auth.empresaId ?? 0);
  }
  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @User() auth: IUserPayload,
  ) {
    return this.getByIdUseCase.execute(id, auth.empresaId ?? 0);
  }
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) sucursalId: number,
    
    @Body() body: UpdateSucursalDto,
    @User() auth: IUserPayload,
  ) {
    return this.updateUseCase.execute(sucursalId, body, auth)
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
    return await this.branchStatusUseCase.execute(id, estado, auth);
  }
}
