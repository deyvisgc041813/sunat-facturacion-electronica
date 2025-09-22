import { Injectable } from '@nestjs/common';
import { CancelInvoiceDto } from 'src/domain/comprobante/dto/invoice/CancelInvoiceDto';
import { ComprobanteRepositoryImpl } from 'src/infrastructure/persistence/comprobante/comprobante.repository.impl';
import { SerieRepositoryImpl } from 'src/infrastructure/persistence/serie/serie.repository.impl';
import { EstadoEnumComprobante } from 'src/util/estado.enum';

@Injectable()
export class AnularComprobanteUseCase {
  constructor(
    private readonly comprobanteRepo: ComprobanteRepositoryImpl,
    private readonly repoSerie: SerieRepositoryImpl,
  ) {}

  async execute(
    cancel: CancelInvoiceDto,
  ): Promise<{ status: boolean; message: string }> {
    const empresaId = cancel.empresaId;
    const numCorrelativo = cancel.correlativo;
    const motivo = cancel.motivo ?? '';
    let serieId = cancel.serieId;
    if (serieId == 0) {
      const rpa = await this.repoSerie.findByEmpresaAndTipCompAndSerie(
        empresaId,
        cancel.tipoComprobante,
        cancel.serie,
      );
      serieId = rpa?.serieId ?? 0;
    }
    const status = await this.comprobanteRepo.updateComprobanteStatus(
      empresaId,
      serieId,
      numCorrelativo,
      motivo,
      EstadoEnumComprobante.ANULADO
    );
    return {
      status,
      message: status
        ? `El comprobante con número ${cancel.serie}-${numCorrelativo} fue anulado correctamente.`
        : `El comprobante con número ${cancel.serie}-${numCorrelativo} no se encuentra registrado en el sistema o ya fue anulado.`,
    };
  }
}