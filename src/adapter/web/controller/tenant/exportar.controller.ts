import {
  Controller,
  ForbiddenException,
  Get,
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
  constructor(
    private readonly sucursalRepo: SucursalRepositoryImpl,
    private readonly comprobanteRepo: ComprobanteRepositoryImpl,
    private readonly comprobantePdfBuilderImpl: ComprobantePdfBuilderImpl,
  ) {}

  @Get('/comprobantes/:id/pdf')
  async generarBoleta(
    @Param('id') comprobanteId: number,
    @User() auth: IUserPayload,
    @Query('tipo') tipo: 'A4' | 'TICKET' = 'A4',
    @Res() res: Response
  ) {
    if (!auth?.sucursales.includes(auth.sucursalActiva)) {
     throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual (ID: ${auth?.sucursalActiva}).`,
      );
    }
    const useCase = new CreatePdfUseCase(
      this.sucursalRepo,
      this.comprobanteRepo,
      this.comprobantePdfBuilderImpl,
    );
    const pdfBuffer = await useCase.execute(
      auth?.empresaId ?? 0,
      auth?.sucursalActiva,
      comprobanteId,
      tipo,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename=boleta.pdf',
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }
}
