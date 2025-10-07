import { Injectable } from "@nestjs/common";
import { SerieResponseDto } from "src/domain/serie-comprobante/dto/reesponse.dto";
import { SerieComprobanteService } from "src/domain/serie-comprobante/service/serie-comprobante.service";
@Injectable()
export class GetBySucursalAndTipComAndSerieUseCase {
  constructor(private readonly serieService: SerieComprobanteService) {}
  async execute(sucursalId: number, tipoComprobante: string, serie: string): Promise<SerieResponseDto | null> {
    return this.serieService.findBySucursalTipCompSerie(sucursalId, tipoComprobante, serie);
  }
}
