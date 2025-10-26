import { Injectable } from '@nestjs/common';
import { ArchivoDescargable } from 'src/domain/tenant/comprobante/comprobante.repository';
import { ConsultarComprobanteService } from 'src/domain/tenant/comprobante/services/consultar-comprobante.service';

@Injectable()
export class ExportSignedXmlDocumentUseCase {
  constructor(private readonly consultarService: ConsultarComprobanteService) {}

  async execute(
    sucursalId: number,
    comprobanteId: number,
    pedidoId?: number,
  ): Promise<ArchivoDescargable | null> {
    const rpta = await this.consultarService.exportSignedXmlDocument(
      sucursalId,
      comprobanteId,
      pedidoId,
    );
    return rpta;
  }
}
