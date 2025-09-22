import { Injectable } from "@nestjs/common";
import { SerieResponseDto } from "src/domain/series/dto/SerieResponseDto";
import { SerieRepositoryImpl } from "src/infrastructure/persistence/serie/serie.repository.impl";
@Injectable()
export class FindByEmpAndTipComAndSerieUseCase {
  constructor(private readonly serieRepo: SerieRepositoryImpl) {}
  async execute(empresaId: number, tipoComprobante: string, serie: string): Promise<SerieResponseDto | null> {
    return this.serieRepo.findByEmpresaAndTipCompAndSerie(empresaId, tipoComprobante, serie);
  }
}
