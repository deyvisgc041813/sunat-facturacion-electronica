
import { BusinessLogicException } from "src/adapter/web/exception/exeception-dynamic";
import { ConprobanteRepository } from "src/domain/tenant/comprobante/comprobante.repository";
import { ComprobanteResponseDto } from "src/domain/tenant/comprobante/dto/conprobante.response.dto";
import { EstadoEnumComprobante } from "src/util/estado.enum";

export class GetByEstadoComprobantesUseCase {
  constructor(private readonly comprobante: ConprobanteRepository) {}

  async execute(estado: string, empresaId: number): Promise<ComprobanteResponseDto[]> {
      const estadoEnum = EstadoEnumComprobante[estado as keyof typeof EstadoEnumComprobante];

      if (!estadoEnum) {
        throw new BusinessLogicException(`Estado inválido: ${estado}`);
      }
    return this.comprobante.findByEstado(estadoEnum, empresaId);
  }
}
