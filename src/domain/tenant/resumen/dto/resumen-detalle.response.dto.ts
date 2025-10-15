import { ComprobanteResponseDto } from "../../comprobante/dto/conprobante.response.dto";



export class ResumenDetalleResponseDto {
  constructor(
    public resBolDetId: number,
    public operacion: string,   // 1 = vigente, 3 = anulado
    // Relaciones
    public comprobante?: ComprobanteResponseDto | null,
  ) {}
}
