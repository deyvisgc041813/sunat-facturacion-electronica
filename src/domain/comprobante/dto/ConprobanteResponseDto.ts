import { ClienteResponseDto } from "src/domain/cliente/dto/ClienteResponseDto";
import { EmpresaResponseDto } from "src/domain/empresa/dto/EmpresaResponseDto";
import { SerieResponseDto } from "src/domain/series/dto/SerieResponseDto";

export class ComprobanteResponseDto {
  constructor(
    public comprobanteId: number,
    public numeroComprobante: number, // correlativo
    public fechaEmision: Date,
    public moneda: string,
    
    // Totales
    public totalGravado: number,
    public totalExonerado: number,
    public totalInafecto: number,
    public totalIgv: number,
    public total: number,

    // Estado
    public estado: string,  // PENDIENTE, ACEPTADO, etc.

    // Relaciones
    public empresa?: EmpresaResponseDto | null,
    public cliente?: ClienteResponseDto | null,
    public serie?: SerieResponseDto | null,

    // Datos adicionales
    public hashCpe?: string,     
    public payloadJson?: any     
  ) {}
}
