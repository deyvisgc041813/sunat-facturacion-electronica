import { SerieResponseDto } from "src/domain/series/dto/SerieResponseDto";
import { SerieRepository } from "src/domain/series/Serie.repository";

export class FindByIdSerieUseCase {
  constructor(private readonly serieRepo: SerieRepository) {}

  async execute(id: number): Promise<SerieResponseDto | null> {
    return this.serieRepo.findById(id);
  }
}
