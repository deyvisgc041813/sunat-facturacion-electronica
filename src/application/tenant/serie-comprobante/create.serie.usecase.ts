import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { CreateSerieDto } from 'src/domain/tenant/serie-comprobante/dto/create.request.dto';
import { SerieResponseDto } from 'src/domain/tenant/serie-comprobante/dto/reesponse.dto';
import { SerieComprobanteService } from 'src/domain/tenant/serie-comprobante/service/serie-comprobante.service';
export class CreateSerieComprobanteUseCase {
  constructor(private readonly serieService: SerieComprobanteService) {}
  async execute( data: CreateSerieDto, auth: IUserPayload): Promise<GenericResponse<SerieResponseDto>> {  
    return this.serieService.create(data, auth);
  }

}
