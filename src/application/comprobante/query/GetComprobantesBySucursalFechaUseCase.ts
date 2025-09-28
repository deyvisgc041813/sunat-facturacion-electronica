
import { ConprobanteRepository } from "src/domain/comprobante/comprobante.repository";
import { ComprobanteResponseDto } from "src/domain/comprobante/dto/ConprobanteResponseDto";

export class GetComprobantesBySucursalFechaUseCase {
  constructor(private readonly comprobante: ConprobanteRepository) {}

  async execute(sucursalId: number, fechaInicio: Date, fechaFin: Date): Promise<ComprobanteResponseDto[]> {
    return this.comprobante.findBySucursalAndFecha(sucursalId, fechaInicio, fechaFin);
  }
}
