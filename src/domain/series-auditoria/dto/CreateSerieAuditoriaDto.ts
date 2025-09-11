export class CreateSerieAuditoriaDto {
  serieId: number;
  usuarioId: number;
  correlativoAnterior: number;
  correlativoNuevo?: number;
  motivo: string;
  constructor(partial?: Partial<CreateSerieAuditoriaDto>) {
    Object.assign(this, partial);
  }
}
