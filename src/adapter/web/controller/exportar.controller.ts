import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CreatePdfUseCase } from 'src/application/pdf/CreatePdfUseCase';
import { ComprobanteRepositoryImpl } from 'src/infrastructure/persistence/comprobante/comprobante.repository.impl';
import { PdfServiceImpl } from 'src/infrastructure/adapter/PdfServiceImpl';
import type { Response } from 'express';
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/sucursal/sucursal.repository.impl';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { User } from 'src/adapter/decorator/user.decorator';
@Controller('exportar')
@UseGuards(JwtAuthGuard)
export class ExportarController {
  constructor(
    private readonly sucursalRepo: SucursalRepositoryImpl,
    private readonly comprobanteRepo: ComprobanteRepositoryImpl,
    private readonly pdfImpl: PdfServiceImpl,
  ) {}

  @Get('/comprobantes/:id/pdf')
  async generarBoleta(
    @Param('id') comprobanteId: number,
    @Query('sucursalId') sucursalId: number,
    @Query('tipo') tipo: 'A4' | 'TICKET' = 'A4',
    @Res() res: Response,
    @User() user: any,
  ) {
    if (!user?.sucursales.includes(Number(sucursalId))) {
      throw new ForbiddenException(
        `La sucursal con ID ${sucursalId} no está autorizada`,
      );
    }
    const useCase = new CreatePdfUseCase(
      this.sucursalRepo,
      this.comprobanteRepo,
      this.pdfImpl,
    );
    const pdfBuffer = await useCase.execute(
      user?.empresaId,
      sucursalId,
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
