import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { SerieRepositoryImpl } from '../../../infrastructure/persistence/serie/serie.repository.impl';
import { CreateSerieDto } from 'src/domain/series/dto/CreateSerieDto';
import { CreateSerieUseCase } from 'src/application/Serie/CreateSerieUseCase';
import { FindAllSerieUseCase } from 'src/application/Serie/FindAllSerieUseCase';
import { FindByIdSerieUseCase } from 'src/application/Serie/FindByIdSerieUseCase';
import { UpdateSerieUseCase } from 'src/application/Serie/UpdateSerieUseCase';
import { UpdateSerieDto } from 'src/domain/series/dto/UpdateSerieDto';
import { UpdateCorrelativoSerieUseCase } from 'src/application/Serie/UpdateCorrelativoSerieUseCase';
import { CatalogoRepositoryImpl } from 'src/infrastructure/persistence/catalogo/catalogo.repository.impl';

@Controller('serie')
export class SerieController {
  constructor(
    private readonly serieRepo: SerieRepositoryImpl,
    private readonly catalogoRepository: CatalogoRepositoryImpl,
  ) {}

  @Post()
  async create(@Body() body: CreateSerieDto) {
    const useCase = new CreateSerieUseCase(
      this.serieRepo,
      this.catalogoRepository,
    );
    return useCase.execute(body);
  }
  @Get()
  async findAll() {
    const surcursalId = 1;
    const useCase = new FindAllSerieUseCase(this.serieRepo);
    return useCase.execute(surcursalId);
  }
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    const surcursalId = 1;
    const useCase = new FindByIdSerieUseCase(this.serieRepo);
    return useCase.execute(surcursalId, id);
  }
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) serieId: number,
    @Body() body: UpdateSerieDto,
  ) {
    const surcursalId = 1;
    const useCase = new UpdateSerieUseCase(this.serieRepo);
    return useCase.execute(body, surcursalId, serieId);
  }
  @Put(':id/correlativo')
  async updateCorrelativo(
    @Param('id', ParseIntPipe) serieId: number,
    @Body() body: UpdateSerieDto,
  ) {
    body.sucursalId = 1
    const useCase = new UpdateCorrelativoSerieUseCase(this.serieRepo);
    return useCase.execute(serieId, body);
  }
}
