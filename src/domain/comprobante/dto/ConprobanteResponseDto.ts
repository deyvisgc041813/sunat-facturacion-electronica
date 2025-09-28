import { ClienteResponseDto } from 'src/domain/cliente/dto/ClienteResponseDto';
import { SerieResponseDto } from 'src/domain/series/dto/SerieResponseDto';
import { SucursalResponseDto } from 'src/domain/sucursal/dto/SucursalResponseDto';

export class ComprobanteResponseDto {
  constructor(
    public comprobanteId: number,
    public numeroComprobante: number, // correlativo
    public fechaEmision: Date,
    public fechaVencimiento: Date,
    public moneda: string,

    // Totales
    public totalGravado: number,
    public totalExonerado: number,
    public totalInafecto: number,
    public totalIgv: number,
    public total: number,
    // fechas auditoria
    public fechaCreate: Date,
    public fechaUpdate: Date,
    // Estado
    public estado: string, // PENDIENTE, ACEPTADO, etc.
    public comunicadoSunat: string,
    public serieCorrelativo: string,
    // Relaciones
    public sucursal?: SucursalResponseDto | null,
    public cliente?: ClienteResponseDto | null,
    public serie?: SerieResponseDto | null,
    public comprobanteRespuestaSunat?: ComprobanteRespuestaSunatResponseDto | null,
    // Datos adicionales
    public payloadJson?: any,
    public fechaAnulacion?: Date,
    public descripcionEstado?: string,
    public icbper?: number,
  ) {}
}

export class ComprobanteRespuestaSunatResponseDto {
  constructor(
    public comprobanteRsptId: number, // ID autoincremental
    public comprobanteId: number, // Relación al comprobante
    public xmlFirmado: string, // XML firmado (base64 o string largo)
    public hashCpe: string, // Hash del CPE (cadena de hasta 100)
    public cdr: Buffer, // CDR como binario (puedes devolver base64 en API)
    public createdAt: Date, // Fecha de creación
  ) {}
}
