import { ComprobanteResponseDto } from "../../comprobante/dto/conprobante.response.dto";

export class BajaComprobanteDetalleResponseDto {
  constructor(
    public bajaComprobanteDetalleId: number, // Identificador único del detalle de baja
    public motivo: string, // Motivo de la baja (opcional)
    public comprobante: ComprobanteResponseDto | null
    // Relaciones
  ) {}
}
