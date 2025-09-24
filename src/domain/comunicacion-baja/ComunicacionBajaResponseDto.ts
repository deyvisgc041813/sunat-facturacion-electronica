import { EmpresaResponseDto } from '../empresa/dto/EmpresaResponseDto';
import { BajaComprobanteDetalleResponseDto } from './BajaComprobanteDetalleResponseDto';

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
    public xml?: string,
    public cdr?: string,
    public hashComunicacion?: string,
    public fechaRecepcionSunat?: Date,
    public codigoRespuestaSunat?: string,
    public mensajeSunat?: string,
    public observacionSunat?: string,
    // Relaciones
    public empresa?: EmpresaResponseDto | null,
    public detalles?: BajaComprobanteDetalleResponseDto[] | null,
  ) {}
}
