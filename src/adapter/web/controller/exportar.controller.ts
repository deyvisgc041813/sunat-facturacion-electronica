import { Controller, Get, Param, Post, Res } from '@nestjs/common';
import { CreatePdfUseCase } from 'src/application/pdf/CreatePdfUseCase';
import { ComprobanteRepositoryImpl } from 'src/infrastructure/persistence/comprobante/comprobante.repository.impl';
import { PdfServiceImpl } from 'src/infrastructure/adapter/PdfServiceImpl';
import type { Response } from 'express';
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/sucursal/sucursal.repository.impl';
@Controller('exportar')
export class ExportarController {
  constructor(
    private readonly sucursalRepo: SucursalRepositoryImpl,
    private readonly comprobanteRepo: ComprobanteRepositoryImpl,
    private readonly pdfImpl: PdfServiceImpl
  ) {}

  @Get('/comprobantes/:id/pdf')
  async generarBoleta(@Param('id') comprobanteId: number, @Res() res: Response) {
    const empresaId = 18;
    const sucursalId = 1;
    const useCase = new CreatePdfUseCase(
      this.sucursalRepo,
      this.comprobanteRepo,
      this.pdfImpl
    );
    const pdfBuffer = await useCase.execute(empresaId, sucursalId, comprobanteId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename=boleta.pdf',
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }
}
