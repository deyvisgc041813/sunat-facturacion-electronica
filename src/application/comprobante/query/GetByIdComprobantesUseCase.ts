
import { ConprobanteRepository } from "src/domain/comprobante/comprobante.repository";
import { ComprobanteResponseDto } from "src/domain/comprobante/dto/ConprobanteResponseDto";

export class GetByIdComprobantesUseCase {
  constructor(private readonly comprobante: ConprobanteRepository) {}

  async execute(componenteId:number, empresaId: number): Promise<ComprobanteResponseDto | null> {
    return this.comprobante.findById(componenteId, empresaId);
  }
}
