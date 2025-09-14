export interface CreateSunatLogDto {
  comprobanteId: number;
  request?: string | null;
  response?: string | null;
  estado?: string | null;
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
}
