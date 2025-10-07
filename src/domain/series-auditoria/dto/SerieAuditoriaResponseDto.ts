import { SerieResponseDto } from "src/domain/serie-comprobante/dto/reesponse.dto";


export class SerieAuditoriaResponseDto {
 
  constructor(
    public readonly serieAuditoriaId: number,
    public readonly usuarioId: number,
    public readonly correlativoAnterior: number,
    public readonly correlativoNuevo: number,
    public readonly motivo: string,
    public readonly fechaCambio: Date,
    public serie?: SerieResponseDto,
    public usuario?: any
  ) {}

}