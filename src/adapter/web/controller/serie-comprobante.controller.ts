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
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { CreateSerieComprobanteUseCase } from 'src/application/serie-comprobante/create.serie.usecase';
import { CreateSerieDto } from 'src/domain/serie-comprobante/dto/create.request.dto';
import type { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { User } from 'src/adapter/decorator/user.decorator';
import { GetByIdSerieComprobanteBySucursalUseCase } from 'src/application/serie-comprobante/get-by-id-serie-sucursal.usecase';
import { GetSerieComprobanteBySucursalUseCase } from 'src/application/serie-comprobante/get.series.usecase';
import { UpdateSerieComprobanteUseCase } from 'src/application/serie-comprobante/update.serie.usecase';
import { UpdateSerieDto } from 'src/domain/serie-comprobante/dto/update.request.dto';
import { AdjustCorrelativeSerieComprobanteUseCase } from 'src/application/serie-comprobante/update.serie-correlativo.usecase';
import { UpdateStatusSerieComprobanteUseCase } from 'src/application/serie-comprobante/update-status.series.usecase';
import { DeleteSeriesComprobanteUseCase } from 'src/application/serie-comprobante/delete.sucursal.usecase';

@Controller('/v1/companies/branch/serie')
@UseGuards(JwtAuthGuard)
export class SerieController {
  constructor(
    private readonly createUseCase: CreateSerieComprobanteUseCase,
    private readonly getByIdUseCase: GetByIdSerieComprobanteBySucursalUseCase,
    private readonly getAllUseCase: GetSerieComprobanteBySucursalUseCase,
    private readonly updateUseCase: UpdateSerieComprobanteUseCase,
    private readonly adjustCorrelativeUseCase: AdjustCorrelativeSerieComprobanteUseCase,
    private readonly updateStatusUseCase: UpdateStatusSerieComprobanteUseCase,
        private readonly deleteUseCase: DeleteSeriesComprobanteUseCase
  ) {}

  @Post()
  async create(@Body() body: CreateSerieDto, @User() auth: IUserPayload) {
    return this.createUseCase.execute(body, auth);
  }
  @Get()
  async findAll( @User() auth: IUserPayload) {
    return this.getAllUseCase.execute(auth.sucursalActiva)
  }
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number, @User() auth: IUserPayload) {
    return this.getByIdUseCase.execute(auth.sucursalActiva, id);
  }
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateSerieDto, @User() auth: IUserPayload
  ) {
    return this.updateUseCase.execute(body, auth, id );
  }

  @Put(':id/adjust-correlative')
  async adjustCorrelative(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {motivo:string, new_correlativo: number},
    @User() auth: IUserPayload
  ) {
    return this.adjustCorrelativeUseCase.execute(id, auth, body.new_correlativo ?? 0, body.motivo)
  }
    @Delete(':id')
    async deleteSerie(
      @Param('id') id: number,
      @User() auth: IUserPayload,
    ): Promise<any> {
      return await this.deleteUseCase.execute(id, auth);
    }
    @Patch(':id/status/:estado')
    async toggleSerieStatus(
      @Param('id') id: number,
      @Param('estado') estado: string,
      @User() auth: IUserPayload,
    ) {
      return await this.updateStatusUseCase.execute(id, estado, auth);
    }
}
