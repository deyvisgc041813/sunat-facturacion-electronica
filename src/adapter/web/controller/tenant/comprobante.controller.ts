import { Body, Controller, Post, UseGuards, Res } from '@nestjs/common';

import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/auditoria/sunat-log.repository.impl';
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/sucursal.repository.impl';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { User } from 'src/adapter/decorator/user.decorator';
import { CreateInvoiceUseCase } from 'src/application/tenant/comprobante/create/CreateInvoiceUseCase';
import { CreateNotaCreditoUseCase } from 'src/application/tenant/comprobante/create/CreateNotaCreditoUseCase';
import { CreateNotaDebitoUseCase } from 'src/application/tenant/comprobante/create/CreateNotaDebitoUseCase';
import { AnularComprobanteUseCase } from 'src/application/tenant/comprobante/update/AnularComprobanteUseCase';
import { ComprobanteRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/comprobante/comprobante.repository.impl';
import { CreateInvoiceDto } from 'src/domain/tenant/comprobante/dto/invoice/create.invoice.dto';
import { CreateNotaDto } from 'src/domain/tenant/comprobante/dto/notasComprobante/create.nota.dto';
import { CancelInvoiceDto } from 'src/domain/tenant/comprobante/dto/invoice/cancel.invoice.dto';
import {
  ConsultarCpeDto,
  ConsultarLoteCpeDto,
} from 'src/domain/tenant/comprobante/dto/cpe/consultar-lote.cpe.dto';
import { GetValidatedCpeUseCase } from 'src/application/tenant/comprobante/query/GetValidatedCpeUseCase';
import { GetValidatedCdrUseCase } from 'src/application/tenant/comprobante/query/GetValidatedCdrUseCase';
import { GetStatusValidateCpeUseCase } from 'src/application/tenant/comprobante/query/GetStatusValidateCpeUseCase';
import type { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { TenantGuard } from 'src/adapter/guards/tenant.guard';
import { ComprobantePdfBuilderImpl } from 'src/infrastructure/adapter/PdfServiceImpl';
import { CreatePdfUseCase } from 'src/application/tenant/pdf/CreatePdfUseCase';
import type { Response } from 'express';
@Controller('companies/branch/documents')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ComprobanteController {
  constructor(
    private readonly createInvoiceUseCase: CreateInvoiceUseCase,
    private readonly createNcUseCase: CreateNotaCreditoUseCase,
    private readonly createNdUseCase: CreateNotaDebitoUseCase,
    private readonly anularComprobante: AnularComprobanteUseCase,
    private readonly sunatService: SunatService,
    private readonly sunatLogRep: SunatLogRepositoryImpl,
    private readonly comprobanteRepo: ComprobanteRepositoryImpl,
    private readonly sucursalRepo: SucursalRepositoryImpl,
    private readonly comprobantePdfBuilder: ComprobantePdfBuilderImpl,
  ) {}

  @Post('/invoices')
  async createInvoice(
    @Body() body: CreateInvoiceDto,
    @User() auth: IUserPayload,
    @Res() res: Response
  ) {
    const invoice = await this.createInvoiceUseCase.execute(body, auth);
    if (body.printOptions && '1' === body.printOptions.generatePdf) {
      const useCase = new CreatePdfUseCase(
        this.sucursalRepo,
        this.comprobanteRepo,
        this.comprobantePdfBuilder,
      );
      const pdfBuffer = await useCase.execute(
        auth?.empresaId ?? 0,
        auth?.sucursalActiva,
        invoice.comprobanteId ?? 0,
        body.printOptions.format ?? "",
      );
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename=boleta.pdf',
        'Content-Length': pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } else {
      res.send(invoice);
    }
  }
  @Post('/credit-notes')
  async createNc(@Body() body: CreateNotaDto, @User() auth: IUserPayload) {
    return await this.createNcUseCase.execute(
      body,
      auth.empresaId ?? 0,
      auth.sucursalActiva,
    );
  }
  @Post('/debit-notes')
  async createNd(@Body() body: CreateNotaDto, @User() auth: IUserPayload) {
    return await this.createNdUseCase.execute(
      body,
      auth.empresaId ?? 0,
      auth.sucursalActiva,
    );
  }
  @Post('cancel/boleta')
  async cancelBoleta(
    @Body() dto: CancelInvoiceDto,
    @User() auth: IUserPayload,
  ) {
    return this.anularComprobante.execute(dto);
  }
  @Post('/validate-cpe')
  async validarCpe(
    @Body() body: ConsultarLoteCpeDto,
    @User() auth: IUserPayload,
  ) {
    const useCase = new GetValidatedCpeUseCase(
      this.sunatService,
      this.comprobanteRepo,
    );
    return await useCase.execute(body, auth.sucursalActiva);
  }
  @Post('/validate-cdr')
  async validarCdr(@Body() body: ConsultarCpeDto, @User() auth: IUserPayload) {
    const useCase = new GetValidatedCdrUseCase(
      this.sunatService,
      this.sunatLogRep,
      this.comprobanteRepo,
    );
    return await useCase.execute(body.cpes, auth.sucursalActiva);
  }

  @Post('/validate-cpe-status')
  async validarStatusComprobante(
    @Body() body: ConsultarCpeDto,
    @User() auth: IUserPayload,
  ) {
    const useCase = new GetStatusValidateCpeUseCase(
      this.sunatService,
      this.sunatLogRep,
      this.comprobanteRepo,
      this.sucursalRepo,
    );
    return await useCase.execute(
      body.cpes,
      auth.empresaId ?? 0,
      auth.sucursalActiva,
    );
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
