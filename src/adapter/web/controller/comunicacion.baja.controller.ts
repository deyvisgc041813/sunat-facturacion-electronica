import { BadRequestException, Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { FirmaService } from '../../../infrastructure/sunat/firma/firma.service';
import { SunatService } from '../../../infrastructure/sunat/send/sunat.service';
import { EmpresaRepositoryImpl } from '../../../infrastructure/persistence/empresa/empresa.repository.impl';
import { ComprobanteRepositoryImpl } from '../../../infrastructure/persistence/comprobante/comprobante.repository.impl';
import { SerieRepositoryImpl } from '../../../infrastructure/persistence/serie/serie.repository.impl';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/sunat-log/sunat-log.repository.impl';
import { CreateComunicacionBajaUseCase } from 'src/application/comunicacion-baja/create/CreateComunicacionBajaUseCase';
import { XmlBuilderComunicacionBajaService } from 'src/infrastructure/sunat/xml/xml-builder-comunicacion-baja.service';
import { ComunicacionBajaRepositoryImpl } from 'src/infrastructure/persistence/comunicacion-baja/baja.repository';
import { ComunicacionBajaDto } from 'src/domain/comunicacion-baja/ComunicacionBajaDto';
import { GetStatusBajaStatusUseCase } from 'src/application/comunicacion-baja/query/GetStatusBajaStatusUseCase';

@Controller('voided-documents')
export class ComunicaciomBajaController {
  constructor(
    private readonly xmlBuilderResService: XmlBuilderComunicacionBajaService,
    private readonly firmaService: FirmaService,
    private readonly sunatService: SunatService,
    private readonly empresaRepo: EmpresaRepositoryImpl,
    private readonly sunatLogRep: SunatLogRepositoryImpl,
    private readonly bajaRepo: ComunicacionBajaRepositoryImpl,
    private readonly comprobanteRepo: ComprobanteRepositoryImpl,
    private readonly serieRepo: SerieRepositoryImpl,
  ) {}
  @Post()
  async create(@Body() body: ComunicacionBajaDto) {
    const useCase = new CreateComunicacionBajaUseCase(
      this.xmlBuilderResService,
      this.firmaService,
      this.sunatService,
      this.empresaRepo,
      this.sunatLogRep,
      this.bajaRepo,
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
    const empresaId = 18
    const useCase = new GetStatusBajaStatusUseCase(
      this.sunatService,
      this.bajaRepo,
      this.sunatLogRep,
      this.comprobanteRepo
    );
    return useCase.execute(empresaId, ticket);
  }
}