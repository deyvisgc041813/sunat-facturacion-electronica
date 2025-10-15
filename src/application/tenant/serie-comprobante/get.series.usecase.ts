import { SerieResponseDto } from "src/domain/tenant/serie-comprobante/dto/reesponse.dto";
import { SerieComprobanteService } from "src/domain/tenant/serie-comprobante/service/serie-comprobante.service";

export class GetSerieComprobanteBySucursalUseCase {
  constructor(private readonly serieService: SerieComprobanteService) {}

  async execute(sucursalId:number): Promise<SerieResponseDto[]> {
    return this.serieService.getAll(sucursalId);
  }
}
