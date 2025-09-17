import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  Res
} from '@nestjs/common';
import type { Response } from 'express'; // 
import { FirmaService } from '../sunat/firma/firma.service';
import { EmpresaRepositoryImpl } from '../database/repository/empresa.repository.impl';
import { ErrorLogRepositoryImpl } from '../database/repository/error-log.repository.impl';
import { generarCertificadoPrueba } from 'src/certificado/generarCertificadoPrueba';
import { SummaryDocumentDto } from 'src/domain/comprobante/dto/resumen/SummaryDocumentDto';
import { GetAllComprobantesUseCase } from 'src/application/comprobante/GetAllComprobantesUseCase';
import { ComprobanteRepositoryImpl } from '../database/repository/comprobante.repository.impl';
import { GetByIdComprobantesUseCase } from 'src/application/comprobante/GetByIdComprobantesUseCase';
import { EstadoEnumComprobante } from 'src/util/estado.enum';
import { GetByEstadoComprobantesUseCase } from 'src/application/comprobante/GetByEstadoComprobantesUseCase';
import { GetByEmpresaAndFechaComprobantesUseCase } from 'src/application/comprobante/GetByEmpresaAndFechaComprobantesUseCase';
import { ExportXmlFirmadoComprobanteUseCase } from 'src/application/comprobante/ExportXmlFirmadoComprobanteUseCase';

import { ExportZipComprobanteUseCase } from 'src/application/comprobante/ExportZipComprobanteUseCase';
import { ExportCdrZipComprobanteUseCase } from 'src/application/comprobante/ExportCdrZipComprobanteUseCase';
import { CreateInvoiceDto } from 'src/domain/comprobante/dto/invoice/CreateInvoiceDto';
import { CreateInvoiceUseCase } from 'src/application/comprobante/CreateInvoiceUseCase';
import { CreateNotaDto } from 'src/domain/comprobante/dto/notasComprobante/CreateNotaDto';
import { CreateNotaCreditoUseCase } from 'src/application/comprobante/CreateNotaCreditoUseCase';
import { CreateNotaDebitoUseCase } from 'src/application/comprobante/CreateNotaDebitoUseCase';

@Controller('documents')
export class ComprobanteController {
  constructor(
    // private readonly xmlBuilder: XmlBuilderService,
    // private readonly firmaService: FirmaService,
    // private readonly sunatService: SunatService,
    // private readonly empresaRepo: EmpresaRepositoryImpl,
    // private readonly errorLogRepo: ErrorLogRepositoryImpl,
    private readonly comprobanteRepository: ComprobanteRepositoryImpl,
    private readonly createInvoiceUseCase: CreateInvoiceUseCase,
    private readonly createNcUseCase: CreateNotaCreditoUseCase,
    private readonly createNdUseCase: CreateNotaDebitoUseCase,

  ) {}

  @Post('/invoices')
  async createInvoice(@Body() body: CreateInvoiceDto) {

    return this.createInvoiceUseCase.execute(body);
  }
  @Post('/credit-notes')
  async createNc(@Body() body: CreateNotaDto) {
   return await this.createNcUseCase.execute(body);
 
  }
  @Post('/debit-notes')
  async createNd(@Body() body: CreateNotaDto) {
   return await this.createNdUseCase.execute(body);
 
  }
  @Post('/daily-summaries')
  async create(@Body() body: SummaryDocumentDto) {
    // const useCase = new CreateResumenUseCase(
    //   this.xmlBuilder,
    //   this.firmaService,
    //   this.sunatService,
    //   this.empresaRepo,
    //   this.errorLogRepo,
    // );
    // return useCase.execute(body);
  }
  @Get('/generarcertificado')
  async generarCerticado() {
    generarCertificadoPrueba();
    return true;
  }

  // Obtener todos los comprobantes de una empresa
  @Get()
  async findAll(@Param('empresaId') empresaId: number) {
    const useCase = new GetAllComprobantesUseCase(this.comprobanteRepository);
    return useCase.execute(empresaId);
  }

  // Obtener comprobante por ID
  @Get(':id')
  async findById(
    @Param('empresaId') empresaId: number,
    @Param('id') comprobanteId: number,
  ) {
    const useCase = new GetByIdComprobantesUseCase(this.comprobanteRepository);
    return useCase.execute(comprobanteId, empresaId);
  }

  // Filtrar por estado
  @Get('estado/:estado')
  async findByEstado(
    @Param('empresaId') empresaId: number,
    @Param('estado') estado: EstadoEnumComprobante,
  ) {
    const useCase = new GetByEstadoComprobantesUseCase(
      this.comprobanteRepository,
    );
    return useCase.execute(estado, empresaId);
  }

  // Filtrar por fechas
  @Get('buscar/fechas')
  async findByEmpresaAndFecha(
    @Param('empresaId') empresaId: number,
    @Query('fecIni') fecIni: Date,
    @Query('fecFin') fecFin: Date,
  ) {
    const useCase = new GetByEmpresaAndFechaComprobantesUseCase(
      this.comprobanteRepository,
    );
    return useCase.execute(empresaId, fecIni, fecFin);
  }

  // Descargar XML firmado
  @Get(':id/xml')
  async getXmlFirmado(
    @Param('empresaId') empresaId: number,
    @Param('id') componenteId: number,
    @Res() res: Response,
  ) {
    const useCase = new ExportXmlFirmadoComprobanteUseCase(
      this.comprobanteRepository,
    );
    const archivo = await useCase.execute(componenteId, empresaId);

    if (!archivo)  return res.status(HttpStatus.NOT_FOUND).send("XML no encontrado");
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${archivo.fileName}`,
    );
    res.setHeader('Content-Type', archivo.mimeType);
    res.send(archivo.content);
  }

  // Descargar ZIP enviado
  @Get(':id/zip')
  async getZipEnviado(
    @Param('empresaId') empresaId: number,
    @Param('id') componenteId: number,
    @Res() res: Response,
  ) {
    const useCase = new ExportZipComprobanteUseCase(
      this.comprobanteRepository,
    );
    const archivo = await useCase.execute(componenteId, empresaId);

    if (!archivo)
      return res.status(HttpStatus.NOT_FOUND).send('ZIP no encontrado');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${archivo.fileName}`,
    );
    res.setHeader('Content-Type', archivo.mimeType);
    res.send(archivo.content);
  }

  // Descargar CDR ZIP
  @Get(':id/cdr')
  async getCdrZip(
    @Param('empresaId') empresaId: number,
    @Param('id') componenteId: number,
    @Res() res: Response,
  ) {
    const useCase = new ExportCdrZipComprobanteUseCase(
      this.comprobanteRepository,
    );
    const archivo = await useCase.execute(componenteId, empresaId);
    if (!archivo)
      return res.status(HttpStatus.NOT_FOUND).send('CDR no encontrado');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${archivo.fileName}`,
    );
    res.setHeader('Content-Type', archivo.mimeType);
    res.send(archivo.content);
  }
}
