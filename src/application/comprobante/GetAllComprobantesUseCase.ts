
import { ConprobanteRepository } from "src/domain/comprobante/comprobante.repository";
import { ComprobanteResponseDto } from "src/domain/comprobante/dto/ConprobanteResponseDto";

export class GetAllComprobantesUseCase {
  constructor(private readonly comprobante: ConprobanteRepository) {}

  async execute(empresaId: number): Promise<ComprobanteResponseDto[]> {
    return this.comprobante.findAll(empresaId);
  }
}
