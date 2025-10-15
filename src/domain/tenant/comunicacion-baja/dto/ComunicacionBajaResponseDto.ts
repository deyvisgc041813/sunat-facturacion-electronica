import { SucursalResponseDto } from "src/domain/parent/sucursal/dto/sucursal.response.dto";
import { BajaComprobanteDetalleResponseDto } from "./baja-comprobante-detalle.response.dto";

export class BajaComprobanteResponseDto {
  constructor(
    public bajaComprobanteId: number,
    public fechaGeneracion: Date,
    public fecReferencia: Date,
    public correlativo: number,
    public nombreArchivo: string,
    public estado: string, // PENDIENTE, ENVIADO, ACEPTADO, RECHAZADO
    public serie: string,
    public ticket: string,
    public sucursalId: number,
    public xml?: string,
    public cdr?: string,
    public hashComunicacion?: string,
    public fechaRecepcionSunat?: Date,
    public codigoRespuestaSunat?: string,
    public mensajeSunat?: string,
    public observacionSunat?: string,
    // Relaciones
    public detalles?: BajaComprobanteDetalleResponseDto[] | null,
  ) {}
}
