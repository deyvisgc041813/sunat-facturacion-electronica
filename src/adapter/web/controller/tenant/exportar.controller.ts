import {
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ComprobantePdfBuilderImpl } from 'src/infrastructure/adapter/PdfServiceImpl';
import type { Response } from 'express';
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/sucursal.repository.impl';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { User } from 'src/adapter/decorator/user.decorator';

import { CreatePdfUseCase } from 'src/application/tenant/pdf/CreatePdfUseCase';
import type { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { TenantGuard } from 'src/adapter/guards/tenant.guard';
import { ComprobanteRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/comprobante/comprobante.repository.impl';
@Controller('companies/branch/export')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ExportarController {
  private readonly logger = new Logger(ExportarController.name);
  constructor(
    private readonly sucursalRepo: SucursalRepositoryImpl,
    private readonly comprobanteRepo: ComprobanteRepositoryImpl,
    private readonly comprobantePdfBuilderImpl: ComprobantePdfBuilderImpl,
  ) {}

  @Get('/comprobantes/:id/pdf')
  async generarComprobante(
    @Param('id') comprobanteId: number,
    @User() auth: IUserPayload,
    @Query('tipo') tipo: 'A4' | 'TICKET' = 'A4',
    @Res() res: Response,
  ) {
    await this.generarPdfComprobante(
      comprobanteId,
      auth,
      tipo,
      res,
      'comprobante',
    );
  }
  @Get('/comprobantes/pedido/:id/pdf')
  async generarComprobantePedido(
    @Param('id') pedidoId: number,
    @User() auth: IUserPayload,
    @Query('tipo') tipo: 'A4' | 'TICKET' = 'A4',
    @Res() res: Response,
  ) {
    await this.generarPdfComprobante(pedidoId, auth, tipo, res, 'pedido');
  }

  /**
   * Método centralizado para generar y devolver el PDF de comprobante.
   */
  private async generarPdfComprobante(
    comprobanteId: number,
    auth: IUserPayload,
    tipo: 'A4' | 'TICKET',
    res: Response,
    contexto: string,
  ): Promise<void> {
    const { sucursalActiva, empresaId } = auth;

    if (!sucursalActiva || sucursalActiva === 0) {
      this.logger.warn(
        `[${contexto.toUpperCase()}] Intento no autorizado desde sucursal inactiva.`,
      );
      throw new ForbiddenException(
        'No tienes autorización para generar comprobantes desde la sucursal actual.',
      );
    }

    const useCase = new CreatePdfUseCase(
      this.sucursalRepo,
      this.comprobanteRepo,
      this.comprobantePdfBuilderImpl,
      
    );

    const inicio = Date.now();
      const pdfBuffer = await useCase.execute(
        empresaId ?? 0,
        sucursalActiva,
        comprobanteId,
        tipo,
        contexto
      );
      const duracion = ((Date.now() - inicio) / 1000).toFixed(2);

      this.logger.log(
        `[${contexto.toUpperCase()}] PDF generado correctamente (Duración: ${duracion}s | Tipo: ${tipo})`,
      );

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=${contexto}-${comprobanteId}.pdf`,
        'Content-Length': pdfBuffer.length,
      });
      res.send(pdfBuffer);
  }
}
