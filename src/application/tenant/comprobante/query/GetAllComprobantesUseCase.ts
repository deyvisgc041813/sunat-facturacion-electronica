import { Injectable } from "@nestjs/common";
import { ComprobanteResponseDto } from "src/domain/tenant/comprobante/dto/conprobante.response.dto";
import { ConsultarComprobanteService } from "src/domain/tenant/comprobante/services/consultar-comprobante.service";

@Injectable()
export class GetAllComprobantesUseCase {
  constructor(private readonly consultarService: ConsultarComprobanteService) {}

  async execute(sucursalId: number): Promise<ComprobanteResponseDto[]> {
    return this.consultarService.getAllDocuments(sucursalId);
  }
}
