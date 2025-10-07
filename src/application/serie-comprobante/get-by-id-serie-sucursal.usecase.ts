import { SerieResponseDto } from "src/domain/serie-comprobante/dto/reesponse.dto";
import { SerieComprobanteService } from "src/domain/serie-comprobante/service/serie-comprobante.service";

export class GetByIdSerieComprobanteBySucursalUseCase {
  constructor(private readonly serieService: SerieComprobanteService) {}

  async execute(sucursalId:number, serieId: number): Promise<SerieResponseDto | null> {
    return this.serieService.getById(sucursalId, serieId);
  }
}
