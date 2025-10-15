
import { Injectable } from "@nestjs/common";
import { ComprobanteResponseDto } from "src/domain/tenant/comprobante/dto/conprobante.response.dto";
import { ComprobanteRepositoryImpl } from "src/infrastructure/persistence/tenant/implement/comprobante/comprobante.repository.impl";

@Injectable()
export class GetByComprobanteAceptadoUseCase {
  constructor(private readonly comprobante: ComprobanteRepositoryImpl) {}

  async execute(sucursalId: number, numCorrelativo: number, serieId: number): Promise<ComprobanteResponseDto | null> {
    return this.comprobante.findByComprobanteAceptado(sucursalId, numCorrelativo, serieId);
  }
}
