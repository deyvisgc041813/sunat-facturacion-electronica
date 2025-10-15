import { ConprobanteRepository } from "src/domain/tenant/comprobante/comprobante.repository";
import { ComprobanteResponseDto } from "src/domain/tenant/comprobante/dto/conprobante.response.dto";

export class GetComprobantesBySucursalFechaUseCase {
  constructor(private readonly comprobante: ConprobanteRepository) {}

  async execute(sucursalId: number, fechaInicio: Date, fechaFin: Date): Promise<ComprobanteResponseDto[]> {
    return this.comprobante.findBySucursalAndFecha(sucursalId, fechaInicio, fechaFin);
  }
}
