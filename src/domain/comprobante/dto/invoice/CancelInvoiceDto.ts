import { IsNotEmpty, IsString, Length, IsNumber, Min, IsOptional, ValidateIf } from 'class-validator';

export class CancelInvoiceDto {
  @IsString({ message: 'El tipo de documento debe ser texto' })
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio' })
  @Length(2, 2, { message: 'El tipo de documento debe tener exactamente 2 caracteres (ej: "03")' })
  tipoComprobante: string; // "03"

  @ValidateIf(o => o.tipoComprobante === '03') // Solo aplica si es boleta
  @IsString({ message: 'La serie debe ser texto' })
  @IsNotEmpty({ message: 'La serie es obligatoria' })
  @Length(4, 4, { message: 'La serie debe tener 4 caracteres (ej: "B001")' })
  serie: string; // "B001"

  @IsNumber({}, { message: 'El correlativo debe ser numérico' })
  @Min(1, { message: 'El correlativo debe ser mayor a 0' })
  correlativo: number; // 123

  @IsString({ message: 'El motivo debe ser texto' })
  @IsNotEmpty({ message: 'El motivo es obligatorio' })
  @Length(10, 100, { message: 'El motivo de anulación debe tener entre 10 y 100 caracteres' })
  motivo?: string; // opcional: "Error de emisión"
  @IsNumber({}, { message: 'El ID de la empresa debe ser numérico' })
  @Min(1, { message: 'El ID de la empresa debe ser mayor a 0' })
  empresaId: number
  @IsOptional()
  serieId:number = 0
}
