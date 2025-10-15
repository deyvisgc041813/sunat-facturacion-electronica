import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsISO8601,
  Min,
  IsIn,
  IsOptional,
  IsPositive,
  IsInt,
} from 'class-validator';
import { IsSerieValida } from 'src/common/validator/validate.series';

export class ComprobanteBaseDto {
  @IsNotEmpty({ message: 'El ID de la sucursal es obligatorio' })
  @IsInt({ message: 'El ID de la sucursal debe ser un número entero' })
  @IsPositive({ message: 'El ID de la sucursal debe ser mayor a 0' })
  sucursalId: number;

  @IsString({ message: 'La versión UBL debe ser un texto' })
  @IsNotEmpty({ message: 'La versión UBL es obligatoria' })
  @IsIn(['2.1'], { message: 'La versión UBL debe ser 2.1' })
  ublVersion: string;
  @IsString({ message: 'El CustomizationID debe ser un texto' })
  @IsNotEmpty({ message: 'El CustomizationID es obligatorio' })
  @IsIn(['2.0'], { message: 'El CustomizationID debe ser 2.0' })
  customizationID: string;

  @IsString({ message: 'El tipo de operación debe ser un texto' })
  @IsNotEmpty({ message: 'El tipo de operación es obligatorio' })
  @IsIn(['0101', '0200', '0301'], {
    message:
      'El tipo de operación no es válido. Valores permitidos: 0101, 0200, 0301',
  })
  tipoOperacion: string;

  @IsString({ message: 'El tipo comprobante debe ser un texto' })
  @IsNotEmpty({ message: 'El tipo comprobante es obligatorio' })
  @IsIn(['01', '03', '07', '08'], {
    message: 'Tipo comprobante no válido (Catálogo 01)',
  })
  tipoComprobante: string;

  @IsString({ message: 'La serie debe ser un texto' })
  @IsNotEmpty({ message: 'La serie es obligatoria' })
  @IsSerieValida('tipoComprobante')
  serie: string;

  @IsISO8601(
    {},
    { message: 'La fecha de emisión debe tener formato ISO8601 (YYYY-MM-DD)' },
  )
  fechaEmision: string;
  @IsString({ message: 'El tipo de moneda debe ser un texto' })
  @IsNotEmpty({ message: 'El tipo de moneda es obligatorio' })
  @IsIn(['PEN', 'USD'], { message: 'La moneda debe ser PEN o USD' })
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
  @IsOptional()
  @IsNumber({}, { message: 'El correlativo debe ser numérico' })
  correlativo: number;
  @IsOptional()
  porcentajeIgv: number; // solo se usara a nivel de backend
}
