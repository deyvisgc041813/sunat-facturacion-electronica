import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express'; //
import { generarCertificadoPrueba } from 'src/certificado/generarCertificadoPrueba';
import { GetAllComprobantesUseCase } from 'src/application/comprobante/query/GetAllComprobantesUseCase';
import { ComprobanteRepositoryImpl } from '../../../infrastructure/persistence/comprobante/comprobante.repository.impl';
import { GetByIdComprobantesUseCase } from 'src/application/comprobante/query/GetByIdComprobantesUseCase';
import { EstadoEnumComprobante } from 'src/util/estado.enum';
import { GetByEstadoComprobantesUseCase } from 'src/application/comprobante/query/GetByEstadoComprobantesUseCase';
import { GetComprobantesBySucursalFechaUseCase } from 'src/application/comprobante/query/GetComprobantesBySucursalFechaUseCase';
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
import {
  ConsultarLoteCpeDto,
  CpeDto,
} from 'src/domain/comprobante/dto/cpe/ConsultarLoteCpeDto';
import { GetValidatedCpeUseCase } from 'src/application/comprobante/query/GetValidatedCpeUseCase';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/sunat-log/sunat-log.repository.impl';
import { GetValidatedCdrUseCase } from 'src/application/comprobante/query/GetValidatedCdrUseCase';
import { GetStatusValidateCpeUseCase } from 'src/application/comprobante/query/GetStatusValidateCpeUseCase';
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/sucursal/sucursal.repository.impl';

@Controller('documents')
export class ComprobanteController {
  constructor(
    private readonly comprobanteRepository: ComprobanteRepositoryImpl,
    private readonly createInvoiceUseCase: CreateInvoiceUseCase,
    private readonly createNcUseCase: CreateNotaCreditoUseCase,
    private readonly createNdUseCase: CreateNotaDebitoUseCase,
    private readonly anularComprobante: AnularComprobanteUseCase,
    private readonly sunatService: SunatService,
    private readonly sunatLogRep: SunatLogRepositoryImpl,
    private readonly comprobanteRepo: ComprobanteRepositoryImpl,
    private readonly sucurSalRepo: SucursalRepositoryImpl
  ) {}

  @Post('/invoices')
  async createInvoice(@Body() body: CreateInvoiceDto) {
    const sucursalId = 1
    const empresaId = 18
    return this.createInvoiceUseCase.execute(body, empresaId, sucursalId);
  }
  @Post('/credit-notes')
  async createNc(@Body() body: CreateNotaDto) {
    const sucursalId = 1
    const empresaId = 18
    return await this.createNcUseCase.execute(body, empresaId, sucursalId);
  }
  @Post('/debit-notes')
  async createNd(@Body() body: CreateNotaDto) {
    const sucursalId = 1
    const empresaId = 18
    return await this.createNdUseCase.execute(body, empresaId, sucursalId);
  }

  @Post('cancel/boleta')
  async cancelBoleta(@Body() dto: CancelInvoiceDto) {
    return this.anularComprobante.execute(dto);
  }
  @Post('/validate-cpe')
  async validarCpe(@Body() body: ConsultarLoteCpeDto) {
    const sucursalId = 1
    const useCase = new GetValidatedCpeUseCase(
      this.sunatService,
      this.comprobanteRepo,
    );
    return await useCase.execute(body, sucursalId);
  }
  @Post('/validate-cdr')
  async validarCdr(@Body() body: CpeDto) {
    const sucursalId = 1
    const empresaId = 18
    const useCase = new GetValidatedCdrUseCase(
      this.sunatService,
      this.sunatLogRep,
      this.comprobanteRepo,
    );
    return await useCase.execute(body, sucursalId);
  }

  @Post('/validate-cpe-status')
  async validarStatusComprobante(@Body() body: CpeDto) {
    const sucursalId = 1
    const empresaId = 18
    const useCase = new GetStatusValidateCpeUseCase(
      this.sunatService,
      this.sunatLogRep,
      this.comprobanteRepo,
      this.sucurSalRepo,
    );
    return await useCase.execute(body, empresaId, sucursalId);
  }
  @Get('/generarcertificado')
  async generarCerticado() {
    generarCertificadoPrueba();
    return true;
  }

  // // Obtener todos los comprobantes de una empresa
  // @Get()
  // async findAll(@Param('empresaId') empresaId: number) {
  //   const useCase = new GetAllComprobantesUseCase(this.comprobanteRepository);
  //   return useCase.execute(empresaId);
  // }

  // // Obtener comprobante por ID
  // @Get(':id')
  // async findById(
  //   @Param('empresaId') empresaId: number,
  //   @Param('id') comprobanteId: number,
  // ) {
  //   const useCase = new GetByIdComprobantesUseCase(this.comprobanteRepository);
  //   return useCase.execute(comprobanteId, empresaId);
  // }

  // // Filtrar por estado
  // @Get('estado/:estado')
  // async findByEstado(
  //   @Param('empresaId') empresaId: number,
  //   @Param('estado') estado: EstadoEnumComprobante,
  // ) {
  //   const useCase = new GetByEstadoComprobantesUseCase(
  //     this.comprobanteRepository,
  //   );
  //   return useCase.execute(estado, empresaId);
  // }

  // // Filtrar por fechas
  // @Get('buscar/fechas')
  // async findByEmpresaAndFecha(
  //   @Param('empresaId') empresaId: number,
  //   @Query('fecIni') fecIni: Date,
  //   @Query('fecFin') fecFin: Date,
  // ) {
  //   const useCase = new GetByEmpresaAndFechaComprobantesUseCase(
  //     this.comprobanteRepository,
  //   );
  //   return useCase.execute(empresaId, fecIni, fecFin);
  // }

  // // Descargar XML firmado
  // @Get(':id/xml')
  // async getXmlFirmado(
  //   @Param('empresaId') empresaId: number,
  //   @Param('id') componenteId: number,
  //   @Res() res: Response,
  // ) {
  //   const useCase = new ExportXmlFirmadoComprobanteUseCase(
  //     this.comprobanteRepository,
  //   );
  //   const archivo = await useCase.execute(componenteId, empresaId);

  //   if (!archivo)
  //     return res.status(HttpStatus.NOT_FOUND).send('XML no encontrado');
  //   res.setHeader(
  //     'Content-Disposition',
  //     `attachment; filename=${archivo.fileName}`,
  //   );
  //   res.setHeader('Content-Type', archivo.mimeType);
  //   res.send(archivo.content);
  // }

  // // Descargar ZIP enviado
  // @Get(':id/zip')
  // async getZipEnviado(
  //   @Param('empresaId') empresaId: number,
  //   @Param('id') componenteId: number,
  //   @Res() res: Response,
  // ) {
  //   const useCase = new ExportZipComprobanteUseCase(this.comprobanteRepository);
  //   const archivo = await useCase.execute(componenteId, empresaId);

  //   if (!archivo)
  //     return res.status(HttpStatus.NOT_FOUND).send('ZIP no encontrado');
  //   res.setHeader(
  //     'Content-Disposition',
  //     `attachment; filename=${archivo.fileName}`,
  //   );
  //   res.setHeader('Content-Type', archivo.mimeType);
  //   res.send(archivo.content);
  // }

  // // Descargar CDR ZIP
  // @Get(':id/cdr')
  // async getCdrZip(
  //   @Param('empresaId') empresaId: number,
  //   @Param('id') componenteId: number,
  //   @Res() res: Response,
  // ) {
  //   const useCase = new ExportCdrZipComprobanteUseCase(
  //     this.comprobanteRepository,
  //   );
  //   const archivo = await useCase.execute(componenteId, empresaId);
  //   if (!archivo)
  //     return res.status(HttpStatus.NOT_FOUND).send('CDR no encontrado');
  //   res.setHeader(
  //     'Content-Disposition',
  //     `attachment; filename=${archivo.fileName}`,
  //   );
  //   res.setHeader('Content-Type', archivo.mimeType);
  //   res.send(archivo.content);
  // }
}
