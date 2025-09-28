export class ErrorLogResponseDto {
  constructor(
    public readonly errorId: number,
    public readonly tipoComprobante: string,
    public readonly serie: string,
    public readonly correlativo: string,
    public readonly origen: string,
    public readonly codigoError: string,
    public readonly mensajeError: string,
    public readonly detallError: string,
    public readonly fechaCreacion: Date,
    public readonly estado: string,
  ) {}
}
