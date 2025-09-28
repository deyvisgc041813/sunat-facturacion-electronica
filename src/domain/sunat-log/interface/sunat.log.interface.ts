import { SucursalResponseDto } from "src/domain/sucursal/dto/SucursalResponseDto";

export interface CreateSunatLogDto {
  comprobanteId?: number | null;
  codigoResSunat?:string | null;
  request?: string | null;
  response?: string | null;
  estado?: string | null;
  resumenId ?: number | null;
  bajaId?:number | null;
  sucursalId?: number | null
  serie?: string
  intentos?:number
  fechaRespuesta?:Date
  fechaEnvio?:Date
  usuarioEnvio?:string
}

export interface UpdateSunatLogDto {
  request?: string | null;
  response?: string | null;
  estado?: string | null;
}

export interface SunatLogResponseDto {
  id: number;
  comprobanteId: number;
  fechaEnvio: Date;
  request?: string | null;
  response?: string | null;
  estado?: string | null;
  resumenId ?: number | null;
  sucursal?: SucursalResponseDto | null
  serie?: string
}
