import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  Min,
} from 'class-validator';

export class DetailDto {
  @IsString({ message: 'El código del producto debe ser un texto' })
  @IsNotEmpty({ message: 'El código del producto es obligatorio' })
  codProducto: string;

  @IsString({ message: 'La unidad debe ser un texto' })
  @IsNotEmpty({ message: 'La unidad es obligatoria' })
  unidad: string;

  @IsString({ message: 'La descripción debe ser un texto' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  
  descripcion: string;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @IsPositive({ message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;

  @IsNumber({}, { message: 'El valor unitario debe ser numérico' })
      @Min(0, {
    message: 'El valor unitario no puede ser negativo',
  })
  mtoValorUnitario: number;

  @IsNumber({}, { message: 'El valor de venta debe ser numérico' })
    @Min(0, {
    message: 'El valor de venta no puede ser negativo',
  })
  mtoValorVenta: number;

  @IsNumber({}, { message: 'La base del IGV debe ser numérica' })
  @Min(0, {
    message: 'La base del IGV no puede ser negativo',
  })
  mtoBaseIgv: number;

  @IsNumber({}, { message: 'El porcentaje de IGV debe ser numérico' })
  @Min(0, {
    message: 'El porcentaje de IGV no puede ser negativo',
  })
  porcentajeIgv: number;

  @IsNumber({}, { message: 'El IGV debe ser numérico' })
  @Min(0, {
    message: 'El IGV no puede ser negativo',
  })
  igv: number;

  @IsNumber({}, { message: 'El tipo de afectación de IGV debe ser numérico' })
  @Min(0, {
    message: 'El tipo de afectación de IGV no puede ser negativo',
  })
  tipAfeIgv: number;

  @IsNumber({}, { message: 'El total de impuestos debe ser numérico' })
  @Min(0, {
    message: 'El total de impuestos no puede ser negativo',
  })
  totalImpuestos: number;

  @IsNumber({}, { message: 'El precio unitario debe ser numérico' })
  @Min(0, {
    message: 'El precio unitario no puede ser negativo',
  })
  mtoPrecioUnitario: number;
  @IsOptional()
  @IsNumber({}, { message: 'El monto de ICBPER debe ser numérico' })
  @Min(0, {
    message: 'El monto de ICBPER no puede ser negativo',
  })
  icbper: number;
  @IsOptional()
  @IsNumber({}, { message: 'El monto de descuento debe ser numérico' })
  @Min(0, {
    message: 'El monto de descuento no puede ser negativo',
  })
  mtoDescuento: number;
}
