import { NotFoundException } from "@nestjs/common";
import { SerieResponseDto } from "src/domain/series/dto/SerieResponseDto";
import { UpdateSerieDto } from "src/domain/series/dto/UpdateSerieDto";
import { SerieRepository } from "src/domain/series/Serie.repository";

export class UpdateSerieUseCase {
  constructor(private readonly serieRepo: SerieRepository) {}
  async execute(data: UpdateSerieDto, sucursalId:number, serieId: number): Promise<{status: boolean, message: string, data?: SerieResponseDto}> {
    const serie = await this.serieRepo.findById(sucursalId, serieId);
    if (!serie) throw new NotFoundException('Serie no encontrada');
    return this.serieRepo.update(sucursalId, data, serieId);
  }
}
