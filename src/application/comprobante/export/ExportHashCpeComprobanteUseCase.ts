
import { ConprobanteRepository } from "src/domain/comprobante/comprobante.repository";

export class ExportHashCpeComprobanteUseCase {
  constructor(private readonly comprobante: ConprobanteRepository) {}

  async execute(componenteId:number, sucursalId: number): Promise<string | null> {
    return this.comprobante.getHashCpe(componenteId, sucursalId);
  }
}
