import { EmpresaResponseDto } from "src/domain/empresa/dto/EmpresaResponseDto";

export class SerieResponseDto {
 
  constructor(
    public serieId: number,
    public tipoComprobante: string,
    public serie: string,
    public correlativoInicial: number,
    public empresa?: EmpresaResponseDto
  ) {}

}
