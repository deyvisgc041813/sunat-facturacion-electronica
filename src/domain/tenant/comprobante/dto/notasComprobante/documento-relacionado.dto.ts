import { IsIn, IsInt, IsNotEmpty, IsString, Matches, Min } from 'class-validator';

export class DocumentoRelacionadoDto {
  @IsString({
    message: 'El tipo de comprobante relacionado debe ser una cadena de texto',
  })
  @IsNotEmpty({ message: 'El tipo de comprobante relacionado es obligatorio' })
  @IsIn(['01', '03'], {
    message:
      'El tipo de comprobante relacionado debe ser 01 (Factura) o 03 (Boleta)',
  })
  tipoComprobante: string;

  @IsString({
    message: 'La serie del documento relacionado debe ser una cadena de texto',
  })
  @IsNotEmpty({ message: 'La serie del documento relacionado es obligatoria' })
  @Matches(/^[A-Z]{1}\d{3}$/, {
    message:
      'La serie del documento relacionado debe tener el formato válido (ej. F001, B001)',
  })
  serie: string;

  @IsInt({
    message:
      'El correlativo del documento relacionado debe ser un número entero',
  })
  @IsNotEmpty({
    message: 'El correlativo del documento relacionado es obligatorio',
  })
  @Min(1, { message: "El correlativo del documento relacionado debe ser mayor a 0" })
  correlativo: number;

  constructor(partial?: Partial<DocumentoRelacionadoDto>) {
    Object.assign(this, partial);
  }
}
