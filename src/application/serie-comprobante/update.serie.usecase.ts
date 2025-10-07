import { IUserPayload } from "src/adapter/decorator/user.decorator.interface";
import { GenericResponse } from "src/adapter/web/response/response.interface";
import { SerieResponseDto } from "src/domain/serie-comprobante/dto/reesponse.dto";
import { UpdateSerieDto } from "src/domain/serie-comprobante/dto/update.request.dto";
import { SerieComprobanteService } from "src/domain/serie-comprobante/service/serie-comprobante.service";

export class UpdateSerieComprobanteUseCase {
  constructor(private readonly serieService: SerieComprobanteService) {}
  async execute(data: UpdateSerieDto, auth: IUserPayload, serieId: number): Promise<GenericResponse<SerieResponseDto>> {
    return this.serieService.update(serieId, auth, data);
  }
}
