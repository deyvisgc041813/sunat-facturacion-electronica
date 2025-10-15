import { ConprobanteRepository } from "src/domain/tenant/comprobante/comprobante.repository";
import { ComprobanteResponseDto } from "src/domain/tenant/comprobante/dto/conprobante.response.dto";


export class GetAllComprobantesUseCase {
  constructor(private readonly comprobante: ConprobanteRepository) {}

  async execute(sucursalId: number): Promise<ComprobanteResponseDto[]> {
    return this.comprobante.findAll(sucursalId);
  }
}
