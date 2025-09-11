import { SerieResponseDto } from "src/domain/series/dto/SerieResponseDto";
import { SerieRepository } from "src/domain/series/Serie.repository";

export class FindAllSerieUseCase {
  constructor(private readonly serieRepo: SerieRepository) {}

  async execute(): Promise<SerieResponseDto[]> {
    return this.serieRepo.findAll();
  }
}
