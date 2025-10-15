export class TributoTasaResponseDto {
  id: number;
  codigoSunat: string;
  nombre: string;
  tasa?: number;
  monto?: number;
  moneda: string;
  vigenciaDesde: string;
  vigenciaHasta?: string;
  observacion?: string;

  constructor(partial: Partial<TributoTasaResponseDto>) {
    Object.assign(this, partial);
  }
}
