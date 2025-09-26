import { Controller, Get, Param, Post, Res } from '@nestjs/common';
import { CreatePdfUseCase } from 'src/application/pdf/CreatePdfUseCase';
import { EmpresaRepositoryImpl } from 'src/infrastructure/persistence/empresa/empresa.repository.impl';
import { ComprobanteRepositoryImpl } from 'src/infrastructure/persistence/comprobante/comprobante.repository.impl';
import { PdfServiceImpl } from 'src/infrastructure/adapter/PdfServiceImpl';
import type { Response } from 'express';
import { ClienteRepository } from 'src/domain/cliente/Cliente.repository';
import { ClienteRepositoryImpl } from 'src/infrastructure/persistence/cliente/cliente.repository.impl';
@Controller('exportar')
export class ExportarController {
  constructor(
    private readonly empresaRepo: EmpresaRepositoryImpl,
    private readonly comprobanteRepo: ComprobanteRepositoryImpl,
    private readonly pdfImpl: PdfServiceImpl,
    private readonly clienteRepo: ClienteRepositoryImpl
  ) {}

  @Get('/comprobantes/:id/pdf')
  async generarBoleta(@Param('id') comprobanteId: number, @Res() res: Response) {
    const empresaId = 18;
    const useCase = new CreatePdfUseCase(
      this.empresaRepo,
      this.comprobanteRepo,
      this.pdfImpl
    );
    const pdfBuffer = await useCase.execute(empresaId, comprobanteId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename=boleta.pdf',
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }
}
