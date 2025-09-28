import { BadRequestException } from "@nestjs/common";
import { SerieResponseDto } from "src/domain/series/dto/SerieResponseDto";
import { UpdateSerieDto } from "src/domain/series/dto/UpdateSerieDto";
import { SerieRepository } from "src/domain/series/Serie.repository";

export class UpdateCorrelativoSerieUseCase {
  constructor(private readonly serieRepo: SerieRepository) {}
  async execute(serieId: number, data: UpdateSerieDto): Promise<{status: boolean, message: string, data?: SerieResponseDto}> {
    if (!data.usuarioId) {
      throw new BadRequestException('El usuarioId es obligatorio');
    }
    if (!data.newCorrelativo) {
      throw new BadRequestException('El nuevo correlativo es obligatorio');
    }
    if (!data.motivo) {
      throw new BadRequestException('El motivo es obligatorio');
    }
    return this.serieRepo.updateCorrelativoAndLog(data.sucursalId ?? 0, serieId, data.usuarioId, data.newCorrelativo, data.motivo);
  }
}
