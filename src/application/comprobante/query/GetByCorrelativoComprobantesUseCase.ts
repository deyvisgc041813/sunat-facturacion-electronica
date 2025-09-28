
import { Injectable } from "@nestjs/common";
import { ComprobanteResponseDto } from "src/domain/comprobante/dto/ConprobanteResponseDto";
import { ComprobanteRepositoryImpl } from "src/infrastructure/persistence/comprobante/comprobante.repository.impl";

@Injectable()
export class GetByCorrelativoComprobantesUseCase {
  constructor(private readonly comprobante: ComprobanteRepositoryImpl) {}

  async execute(sucursalId: number, numCorrelativo: number, serieId: number): Promise<ComprobanteResponseDto | null> {
    return this.comprobante.findByComprobanteAceptado(sucursalId, numCorrelativo, serieId);
  }
}
