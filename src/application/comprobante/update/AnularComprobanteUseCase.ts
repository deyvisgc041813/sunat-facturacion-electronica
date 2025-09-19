import { Injectable } from "@nestjs/common";
import { ComprobanteRepositoryImpl } from "src/infrastructure/database/repository/comprobante.repository.impl";

@Injectable()
export class AnularComprobanteUseCase {
  constructor(private readonly comprobanteRepo: ComprobanteRepositoryImpl) {}

  async execute(
    empresaId: number,
    serieId: number,
    numCorrelativo: number,
    motivo: string
  ): Promise<boolean> {
    return this.comprobanteRepo.anularComprobante(
      empresaId,
      serieId,
      numCorrelativo,
      motivo,
    );
  }
}
