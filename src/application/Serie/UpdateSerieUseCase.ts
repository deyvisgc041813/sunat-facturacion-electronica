import { NotFoundException } from "@nestjs/common";
import { SerieResponseDto } from "src/domain/series/dto/SerieResponseDto";
import { UpdateSerieDto } from "src/domain/series/dto/UpdateSerieDto";
import { SerieRepository } from "src/domain/series/Serie.repository";

export class UpdateSerieUseCase {
  constructor(private readonly serieRepo: SerieRepository) {}
  async execute(data: UpdateSerieDto, serieId: number): Promise<{status: boolean, message: string, data?: SerieResponseDto}> {
    const empresa = await this.serieRepo.findById(serieId);
    if (!empresa) throw new NotFoundException('Serie no encontrada');
    return this.serieRepo.update(data, serieId);
  }
}
