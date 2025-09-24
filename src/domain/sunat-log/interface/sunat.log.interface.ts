import { EmpresaResponseDto } from "src/domain/empresa/dto/EmpresaResponseDto";

export interface CreateSunatLogDto {
  comprobanteId?: number | null;
  codigoResSunat?:string | null;
  request?: string | null;
  response?: string | null;
  estado?: string | null;
  resumenId ?: number | null;
  empresaId?: number | null
  serie?: string
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
  empresa?: EmpresaResponseDto | null
  serie?: string
}
