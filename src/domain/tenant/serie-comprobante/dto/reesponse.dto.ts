export class SerieResponseDto {
 
  constructor(
    public serieId: number,
    public sucursalId: number,
    public tipoComprobante: string,
    public serie: string,
    public correlativoInicial: number,
    public correlativoActual: number,
    public usuarioRegistro:string,
    public fechaRegistro:Date,
    public usuarioModificacion?:string,
    public fechaModificacion?:Date,
  ) {}

}
