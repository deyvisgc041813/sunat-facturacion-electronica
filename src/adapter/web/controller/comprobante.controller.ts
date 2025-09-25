import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res
} from '@nestjs/common';
import type { Response } from 'express'; // 
import { generarCertificadoPrueba } from 'src/certificado/generarCertificadoPrueba';
import { GetAllComprobantesUseCase } from 'src/application/comprobante/query/GetAllComprobantesUseCase';
import { ComprobanteRepositoryImpl } from '../../../infrastructure/persistence/comprobante/comprobante.repository.impl';
import { GetByIdComprobantesUseCase } from 'src/application/comprobante/query/GetByIdComprobantesUseCase';
import { EstadoEnumComprobante } from 'src/util/estado.enum';
import { GetByEstadoComprobantesUseCase } from 'src/application/comprobante/query/GetByEstadoComprobantesUseCase';
import { GetByEmpresaAndFechaComprobantesUseCase } from 'src/application/comprobante/query/GetByEmpresaAndFechaComprobantesUseCase';
import { ExportXmlFirmadoComprobanteUseCase } from 'src/application/comprobante/export/ExportXmlFirmadoComprobanteUseCase';

import { ExportZipComprobanteUseCase } from 'src/application/comprobante/export/ExportZipComprobanteUseCase';
import { ExportCdrZipComprobanteUseCase } from 'src/application/comprobante/export/ExportCdrZipComprobanteUseCase';
import { CreateInvoiceDto } from 'src/domain/comprobante/dto/invoice/CreateInvoiceDto';
import { CreateNotaDto } from 'src/domain/comprobante/dto/notasComprobante/CreateNotaDto';
import { CreateNotaCreditoUseCase } from 'src/application/comprobante/create/CreateNotaCreditoUseCase';
import { CreateNotaDebitoUseCase } from 'src/application/comprobante/create/CreateNotaDebitoUseCase';
import { CreateInvoiceUseCase } from 'src/application/comprobante/create/CreateInvoiceUseCase';
import { CancelInvoiceDto } from 'src/domain/comprobante/dto/invoice/CancelInvoiceDto';
import { AnularComprobanteUseCase } from 'src/application/comprobante/update/AnularComprobanteUseCase';
import { ConsultarLoteCpeDto, CpeDto } from 'src/domain/comprobante/dto/cpe/ConsultarLoteCpeDto';
import { GetValidatedCpeUseCase } from 'src/application/comprobante/query/GetValidatedCpeUseCase';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { EmpresaRepositoryImpl } from 'src/infrastructure/persistence/empresa/empresa.repository.impl';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/sunat-log/sunat-log.repository.impl';
import { GetValidatedCdrUseCase } from 'src/application/comprobante/query/GetValidatedCdrUseCase';
import { GetStatusValidateCpeUseCase } from 'src/application/comprobante/query/GetStatusValidateCpeUseCase';

@Controller('documents')
export class ComprobanteController {
  constructor(
    private readonly comprobanteRepository: ComprobanteRepositoryImpl,
    private readonly createInvoiceUseCase: CreateInvoiceUseCase,
    private readonly createNcUseCase: CreateNotaCreditoUseCase,
    private readonly createNdUseCase: CreateNotaDebitoUseCase,
    private readonly anularComprobante: AnularComprobanteUseCase,
    private readonly sunatService: SunatService,
    private readonly empresaRepo: EmpresaRepositoryImpl,
    private readonly sunatLogRep: SunatLogRepositoryImpl,
    private readonly comprobanteRepo: ComprobanteRepositoryImpl

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
  
  @Post('cancel/boleta')
  async cancelBoleta(@Body() dto: CancelInvoiceDto) {
    return this.anularComprobante.execute(dto);
  }
  @Post('/validate-cpe')
  async validarCpe(@Body() body: ConsultarLoteCpeDto) {
   const empresaId = 18
   const useCase = new GetValidatedCpeUseCase(this.sunatService, this.comprobanteRepo)
   return await useCase.execute(body, empresaId);
  }
    @Post('/validate-cdr')
  async validarCdr(@Body() body: CpeDto) {
   const empresaId = 18
   const useCase = new GetValidatedCdrUseCase(this.sunatService, this.sunatLogRep, this.comprobanteRepo)
   return await useCase.execute(body, empresaId);
  }
  
  @Post('/validate-cpe-status')
  async validarStatusComprobante(@Body() body: CpeDto) {
   const empresaId = 18
   const useCase = new GetStatusValidateCpeUseCase(this.sunatService, this.sunatLogRep, this.comprobanteRepo, this.empresaRepo)
   return await useCase.execute(body, empresaId);
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
