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
import { ErrorLogRepositoryImpl } from '../../../infrastructure/persistence/error-log/error-log.repository.impl';
import { EmpresaRepositoryImpl } from '../../../infrastructure/persistence/empresa/empresa.repository.impl';
import { XmlBuilderResumenService } from '../../../infrastructure/sunat/xml/xml-builder-resumen.service';
import { ResumenRepositoryImpl } from '../../../infrastructure/persistence/resumen/resumen.repository';
import { ComprobanteRepositoryImpl } from '../../../infrastructure/persistence/comprobante/comprobante.repository.impl';
import { SerieRepositoryImpl } from '../../../infrastructure/persistence/serie/serie.repository.impl';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/sunat-log/sunat-log.repository.impl';
import { GetStatusResumenUseCase } from 'src/application/resumen/query/GetStatusResumenUseCase';

@Controller('summaries')
export class ResumenController {
  constructor(
    private readonly xmlBuilderResService: XmlBuilderResumenService,
    private readonly firmaService: FirmaService,
    private readonly sunatService: SunatService,
    private readonly empresaRepo: EmpresaRepositoryImpl,
    private readonly errorLogRep: ErrorLogRepositoryImpl,
    private readonly sunatLogRep: SunatLogRepositoryImpl,
    private readonly reposiResumen: ResumenRepositoryImpl,
    private readonly comprobanteRepo: ComprobanteRepositoryImpl,
    private readonly serieRepo: SerieRepositoryImpl,
  ) {}
  @Post('/daily')
  async create(@Body() body: SummaryDocumentDto) {
    const useCase = new CreateResumenUseCase(
      this.xmlBuilderResService,
      this.firmaService,
      this.sunatService,
      this.empresaRepo,
      this.sunatLogRep,
      this.reposiResumen,
      this.comprobanteRepo,
      this.serieRepo,
    );
    return await useCase.execute(body);
  }
  @Get('status/:ticket')
  async getStatus(@Param('ticket') ticket: string) {
    // 1. Consultar en SUNAT
    if (!ticket || ticket.trim().length === 0) {
      throw new BadRequestException('El ticket es obligatorio');
    }
    const empresaId = 18;
    const useCase = new GetStatusResumenUseCase(
      this.sunatService,
      this.reposiResumen,
      this.sunatLogRep,
      this.comprobanteRepo,
      this.empresaRepo,
    );
    return useCase.execute(empresaId, ticket);
  }
}
