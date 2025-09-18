
import { ConprobanteRepository } from "src/domain/comprobante/comprobante.repository";
import { ComprobanteResponseDto } from "src/domain/comprobante/dto/ConprobanteResponseDto";

export class GetByEmpresaAndFechaComprobantesUseCase {
  constructor(private readonly comprobante: ConprobanteRepository) {}

  async execute(empresaId: number, fechaInicio: Date, fechaFin: Date): Promise<ComprobanteResponseDto[]> {
    return this.comprobante.findByEmpresaAndFecha(empresaId, fechaInicio, fechaFin);
  }
}
