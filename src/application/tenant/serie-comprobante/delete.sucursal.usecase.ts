
import { IUserPayload } from "src/adapter/decorator/user.decorator.interface";
import { GenericResponse } from "src/adapter/web/response/response.interface";
import { SerieComprobanteService } from "src/domain/tenant/serie-comprobante/service/serie-comprobante.service";

export class DeleteSeriesComprobanteUseCase {
  constructor(private readonly serieService: SerieComprobanteService) {}
  async execute(sucursalId:number, auth: IUserPayload): Promise<GenericResponse<void>> {
    return this.serieService.delete(sucursalId, auth);
  }


}
