import { Injectable } from '@nestjs/common';
import { ComprobanteResponseDto } from 'src/domain/tenant/comprobante/dto/conprobante.response.dto';
import { ConsultarComprobanteService } from 'src/domain/tenant/comprobante/services/consultar-comprobante.service';

@Injectable()
export class GetByFechaComprobantesUseCase {
  constructor(private readonly consultarService: ConsultarComprobanteService) {}

  async execute(
    surcursalId: number,
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<ComprobanteResponseDto[] | null> {
    const rpta = await this.consultarService.getByFechaDocuments(
      surcursalId,
      fechaInicio,
      fechaFin
    );
    return rpta;
  }
}
