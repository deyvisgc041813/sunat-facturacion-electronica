import { EmpresaResponseDto } from "src/domain/empresa/dto/EmpresaResponseDto";
import { ResumenDetalleResponseDto } from "./ResumenDetalleResponseDto";

export class ResumenResponseDto {
  constructor(
    public resBolId: number,
    public fechaGeneracion: Date,
    public fechaEmision: Date,
    public correlativo: number,
    public nombreArchivo: string,
    public estado: string,  // PENDIENTE, ENVIADO, ACEPTADO, RECHAZADO
    public ticket: string,  // PENDIENTE, ENVIADO, ACEPTADO, RECHAZADO
    public resumenId:string,
    public fechaRespuestaSunat?:Date,
    public codigoRespuestaSunat?:string,
    public mensajeRespuestaSunat?:string,
    // Datos adicionales
    public xml?: string,
    public cdr?: string,
    public hashResumen?: string,

    // Relaciones
    public empresa?: EmpresaResponseDto | null,
    public detalles?: ResumenDetalleResponseDto[] | null,
  ) {}
}
