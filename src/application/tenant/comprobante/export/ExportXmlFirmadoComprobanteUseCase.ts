import { ArchivoDescargable, ConprobanteRepository } from "src/domain/tenant/comprobante/comprobante.repository";


export class ExportXmlFirmadoComprobanteUseCase {
  constructor(private readonly comprobante: ConprobanteRepository) {}

  async execute(componenteId:number, sucursalId: number): Promise<ArchivoDescargable | null> {
    return this.comprobante.getXmlFirmado(componenteId, sucursalId);
  }
}
