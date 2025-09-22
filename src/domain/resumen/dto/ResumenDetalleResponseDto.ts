import { ComprobanteResponseDto } from "src/domain/comprobante/dto/ConprobanteResponseDto";


export class ResumenDetalleResponseDto {
  constructor(
    public resBolDetId: number,
    public operacion: string,   // 1 = vigente, 3 = anulado
    // Relaciones
    public comprobante?: ComprobanteResponseDto | null,
  ) {}
}
