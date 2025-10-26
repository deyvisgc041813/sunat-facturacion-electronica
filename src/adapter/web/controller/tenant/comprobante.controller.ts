import {
  Body,
  Controller,
  Post,
  UseGuards,
  Res,
  ForbiddenException,
  Get,
  Param,
  Query,
} from '@nestjs/common';

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
import { GetAllComprobantesUseCase } from 'src/application/tenant/comprobante/query/GetAllComprobantesUseCase';
import { GetByIdComprobantesUseCase } from 'src/application/tenant/comprobante/query/GetByIdComprobantesUseCase';
import { GetByFechaComprobantesUseCase } from 'src/application/tenant/comprobante/query/GetByFechaComprobantesUseCase';
import { ExportSignedXmlDocumentUseCase } from 'src/application/tenant/comprobante/export/ExportSignedXmlDocumentUseCase';
import { ExportCdrZipComprobanteUseCase } from 'src/application/tenant/comprobante/export/ExportCdrZipComprobanteUseCase';
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
    private readonly getAllUseCase: GetAllComprobantesUseCase,
    private readonly getByIdUseCase: GetByIdComprobantesUseCase,
    private readonly GetByFechaUseCase: GetByFechaComprobantesUseCase,
    private readonly exportSignedXmlUseCase: ExportSignedXmlDocumentUseCase,
    private readonly exportCdrZipUseCase: ExportCdrZipComprobanteUseCase,
  ) {}

  @Post('/invoices')
  async createInvoice(
    @Body() body: CreateInvoiceDto,
    @User() auth: IUserPayload,
    @Res() res: Response,
  ) {
    if (!auth?.sucursalActiva || auth?.sucursalActiva == 0) {
      throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual.`,
      );
    }
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
        body.printOptions.format ?? '',
        'comprobante',
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
    if (!auth?.sucursalActiva || auth?.sucursalActiva == 0) {
      throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual.`,
      );
    }
    return await this.createNcUseCase.execute(
      body,
      auth.empresaId ?? 0,
      auth.sucursalActiva,
    );
  }
  @Post('/debit-notes')
  async createNd(@Body() body: CreateNotaDto, @User() auth: IUserPayload) {
    if (!auth?.sucursalActiva || auth?.sucursalActiva == 0) {
      throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual.`,
      );
    }
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
    if (!auth?.sucursalActiva || auth?.sucursalActiva == 0) {
      throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual.`,
      );
    }
    return this.anularComprobante.execute(dto);
  }
  @Post('/validate-cpe')
  async validarCpe(
    @Body() body: ConsultarLoteCpeDto,
    @User() auth: IUserPayload,
  ) {
    if (!auth?.sucursalActiva || auth?.sucursalActiva == 0) {
      throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual.`,
      );
    }
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
    if (!auth?.sucursalActiva || auth?.sucursalActiva == 0) {
      throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual.`,
      );
    }
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
  @Get('invoices/items')
  async findAll(
    @Param('sucursalId') sucursalId: number | undefined,
    @User() auth: IUserPayload,
  ) {
    if (!auth?.sucursalActiva || auth?.sucursalActiva === 0) {
      throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual.`,
      );
    }
    const sucursalIdFinal = sucursalId ?? auth.sucursalActiva;
    return this.getAllUseCase.execute(sucursalIdFinal);
  }

  @Get('invoice/:id')
  async findById(
    @Param('id') comprobanteId: number,
    @Param('sucursalId') sucursalId: number | undefined,
    @User() auth: IUserPayload,
  ) {
    // Validación de autorización
    if (!auth?.sucursalActiva || auth?.sucursalActiva === 0) {
      throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual.`,
      );
    }
    const sucursalIdFinal = sucursalId ?? auth.sucursalActiva;
    return this.getByIdUseCase.execute(comprobanteId, sucursalIdFinal);
  }
  // Filtrar por fechas
  @Get('invoices/items/by-date')
  async findByEmpresaAndFecha(
    @Query('fecIni') fecIni: Date,
    @Query('fecFin') fecFin: Date,
    @User() auth: IUserPayload,
  ) {
    // Validación de autorización
    if (!auth?.sucursalActiva || auth?.sucursalActiva === 0) {
      throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual.`,
      );
    }
    return this.GetByFechaUseCase.execute(auth.sucursalActiva, fecIni, fecFin);
  }

  // ==============================
  // Descargar XML por Comprobante ID
  // ==============================
  @Get('invoices/download/:id/xml')
  async getXmlByComprobanteId(
    @Param('id') comprobanteId: number,
    @Res() res: Response,
    @User() auth: IUserPayload,
  ) {
    if (!auth?.sucursalActiva || auth.sucursalActiva === 0) {
      throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual.`,
      );
    }

    const archivo = await this.exportSignedXmlUseCase.execute(
      auth.sucursalActiva,
      comprobanteId,
      0, // sin pedido
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${archivo?.fileName}`,
    );
    res.setHeader('Content-Type', archivo?.mimeType ?? '');
    res.send(archivo?.content);
  }

  // ==============================
  // Descargar XML por Pedido ID
  // ==============================
  @Get('invoices/download/pedido/:pedidoId/xml')
  async getXmlByPedidoId(
    @Param('pedidoId') pedidoId: number,
    @Res() res: Response,
    @User() auth: IUserPayload,
  ) {
    if (!auth?.sucursalActiva || auth.sucursalActiva === 0) {
      throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual.`,
      );
    }

    const archivo = await this.exportSignedXmlUseCase.execute(
      auth.sucursalActiva,
      0, // sin comprobanteId
      pedidoId,
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${archivo?.fileName}`,
    );
    res.setHeader('Content-Type', archivo?.mimeType ?? '');
    res.send(archivo?.content);
  }

  // ==============================
  // Descargar CDR por Comprobante ID
  // ==============================
  @Get('invoices/download/:id/cdr')
  async getCdrByComprobanteId(
    @Param('id') comprobanteId: number,
    @Res() res: Response,
    @User() auth: IUserPayload,
  ) {
    if (!auth?.sucursalActiva || auth.sucursalActiva === 0) {
      throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual.`,
      );
    }

    const archivo = await this.exportCdrZipUseCase.execute(
      auth.sucursalActiva,
      comprobanteId,
      0,
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${archivo?.fileName}`,
    );
    res.setHeader('Content-Type', archivo?.mimeType ?? '');
    res.send(archivo?.content);
  }

  // ==============================
  // Descargar CDR por Pedido ID
  // ==============================
  @Get('invoices/download/pedido/:pedidoId/cdr')
  async getCdrByPedidoId(
    @Param('pedidoId') pedidoId: number,
    @Res() res: Response,
    @User() auth: IUserPayload,
  ) {
    if (!auth?.sucursalActiva || auth.sucursalActiva === 0) {
      throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual.`,
      );
    }

    const archivo = await this.exportCdrZipUseCase.execute(
      auth.sucursalActiva,
      0,
      pedidoId,
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${archivo?.fileName}`,
    );
    res.setHeader('Content-Type', archivo?.mimeType ?? '');
    res.send(archivo?.content);
  }
}
