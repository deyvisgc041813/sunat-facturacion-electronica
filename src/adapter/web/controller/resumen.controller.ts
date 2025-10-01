import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { SummaryDocumentDto } from 'src/domain/resumen/dto/SummaryDocumentDto';
import { CreateResumenUseCase } from 'src/application/resumen/create/CreateResumenUseCase';
import { FirmaService } from '../../../infrastructure/sunat/firma/firma.service';
import { SunatService } from '../../../infrastructure/sunat/send/sunat.service';
import { XmlBuilderResumenService } from '../../../infrastructure/sunat/xml/xml-builder-resumen.service';
import { ResumenRepositoryImpl } from '../../../infrastructure/persistence/resumen/resumen.repository';
import { ComprobanteRepositoryImpl } from '../../../infrastructure/persistence/comprobante/comprobante.repository.impl';
import { SerieRepositoryImpl } from '../../../infrastructure/persistence/serie/serie.repository.impl';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/sunat-log/sunat-log.repository.impl';
import { GetStatusResumenUseCase } from 'src/application/resumen/query/GetStatusResumenUseCase';
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/sucursal/sucursal.repository.impl';

@Controller('summaries')
export class ResumenController {
  constructor(
    private readonly xmlBuilderResService: XmlBuilderResumenService,
    private readonly firmaService: FirmaService,
    private readonly sunatService: SunatService,
    private readonly sunatLogRep: SunatLogRepositoryImpl,
    private readonly reposiResumen: ResumenRepositoryImpl,
    private readonly comprobanteRepo: ComprobanteRepositoryImpl,
    private readonly serieRepo: SerieRepositoryImpl,
    private readonly sucursalRepo: SucursalRepositoryImpl
  ) {}
  @Post('/daily')
  async create(@Body() body: SummaryDocumentDto) {
    const useCase = new CreateResumenUseCase(
      this.xmlBuilderResService,
      this.firmaService,
      this.sunatService,
      this.sunatLogRep,
      this.reposiResumen,
      this.comprobanteRepo,
      this.serieRepo,
      this.sucursalRepo
    );
    const sucursalId = 1;
    const empresaId = 18;
    return await useCase.execute(body, empresaId, sucursalId);
  }
  @Get('status/:ticket')
  async getStatus(@Param('ticket') ticket: string) {
    // 1. Consultar en SUNAT
    if (!ticket || ticket.trim().length === 0) {
      throw new BadRequestException('El ticket es obligatorio');
    }
    const empresalId = 18;
    const sucursalId = 1;
    const useCase = new GetStatusResumenUseCase(
      this.sunatService,
      this.reposiResumen,
      this.sunatLogRep,
      this.comprobanteRepo,
      this.sucursalRepo,
    );
    return useCase.execute(empresalId, sucursalId, ticket);
  }
}
