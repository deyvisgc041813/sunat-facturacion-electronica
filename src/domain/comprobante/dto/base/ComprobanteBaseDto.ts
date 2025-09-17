import {
  IsString,
  IsNotEmpty,
  Length,
  IsNumber,
  IsISO8601,
  Min,
} from 'class-validator';

export class ComprobanteBaseDto {
  @IsString({ message: 'La versión UBL debe ser un texto' })
  @IsNotEmpty({ message: 'La versión UBL es obligatoria' })
  ublVersion: string;
  @IsString({ message: 'El tipo de operación debe ser un texto' })
  @IsNotEmpty({ message: 'El tipo de operación es obligatorio' })
  tipoOperacion: string;

  @IsString({ message: 'El tipo comprobante debe ser un texto' })
  @IsNotEmpty({ message: 'El tipo comprobante es obligatorio' })
  tipoComprobante: string;

  @IsString({ message: 'La serie debe ser un texto' })
  @IsNotEmpty({ message: 'La serie es obligatoria' })
  serie: string;
  @IsNumber({}, { message: 'El correlativo debe ser numérico' })
  @IsNotEmpty({ message: 'El correlativo es obligatorio' })
  correlativo: number;

  @IsISO8601(
    {},
    { message: 'La fecha de emisión debe tener formato ISO8601 (YYYY-MM-DD)' },
  )
  fechaEmision: string;
  @IsString({ message: 'El tipo de moneda debe ser un texto' })
  @IsNotEmpty({ message: 'El tipo de moneda es obligatorio' })
  tipoMoneda: string;

  @IsNumber(
    {},
    { message: 'El monto de operaciones gravadas debe ser numérico' },
  )
  @Min(0, { message: 'El monto de operaciones gravadas no puede ser negativo' })
  mtoOperGravadas: number;

  @IsNumber(
    {},
    { message: 'El monto de operaciones exoneradas debe ser numérico' },
  )
  @Min(0, {
    message: 'El monto de operaciones exoneradas no puede ser negativo',
  })
  mtoOperExoneradas: number;

  @IsNumber(
    {},
    { message: 'El monto de operaciones inafectas debe ser numérico' },
  )
  @Min(0, {
    message: 'El monto de operaciones inafectas no puede ser negativo',
  })
  mtoOperInafectas: number;

  @IsNumber({}, { message: 'El monto de IGV debe ser numérico' })
  @Min(0, {
    message: 'El monto de IGV no puede ser negativo',
  })
  mtoIGV: number;

  @IsNumber({}, { message: 'El subtotal debe ser numérico' })
  @Min(0, {
    message: 'El subtotal debe no puede ser negativo',
  })
  subTotal: number;

  @IsNumber({}, { message: 'El monto de importe de venta debe ser numérico' })
  @Min(0, {
    message: 'El monto de importe de venta no puede ser negativo',
  })
  mtoImpVenta: number;
}
