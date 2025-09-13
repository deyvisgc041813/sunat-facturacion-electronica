
import { ConprobanteRepository } from "src/domain/comprobante/comprobante.repository";
import { ComprobanteResponseDto } from "src/domain/comprobante/dto/ConprobanteResponseDto";
import { EstadoEnumComprobante } from "src/util/estado.enum";

export class GetByEstadoComprobantesUseCase {
  constructor(private readonly comprobante: ConprobanteRepository) {}

  async execute(estado: string, empresaId: number): Promise<ComprobanteResponseDto[]> {
      const estadoEnum = EstadoEnumComprobante[estado as keyof typeof EstadoEnumComprobante];

      if (!estadoEnum) {
        throw new Error(`Estado inválido: ${estado}`);
      }
    return this.comprobante.findByEstado(estadoEnum, empresaId);
  }
}
