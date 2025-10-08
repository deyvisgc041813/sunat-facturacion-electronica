import { BadRequestException } from '@nestjs/common';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { SerieResponseDto } from 'src/domain/serie-comprobante/dto/reesponse.dto';
import { SerieComprobanteService } from 'src/domain/serie-comprobante/service/serie-comprobante.service';

export class AdjustCorrelativeSerieComprobanteUseCase {
  constructor(private readonly serieService: SerieComprobanteService) {}
  async execute(
    serieId: number,
    auth: IUserPayload,
    newCorrelativo: number,
    motivo: string,
  ): Promise<GenericResponse<SerieResponseDto>> {
    if (!newCorrelativo || newCorrelativo <= 0) {
      throw new BadRequestException(
        'El valor del nuevo correlativo es obligatorio y debe ser mayor a cero.',
      );
    }
    if (!motivo) {
      throw new BadRequestException(
        'El valor del motivo es obligatorio .',
      );
    }
    return this.serieService.adjustCorrelative(
      auth.sucursalActiva ?? 0,
      serieId,
      auth.userId,
      newCorrelativo,
      motivo,
    );
  }
}
