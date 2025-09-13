
import { ArchivoDescargable, ConprobanteRepository } from "src/domain/comprobante/comprobante.repository";

export class ExportCdrZipComprobanteUseCase {
  constructor(private readonly comprobante: ConprobanteRepository) {}

  async execute(componenteId:number, empresaId: number): Promise<ArchivoDescargable | null> {
    return this.comprobante.getCdrZip(componenteId, empresaId);
  }
}
