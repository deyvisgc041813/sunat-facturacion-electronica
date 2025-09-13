import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

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
  mtoValorUnitario: number;

  @IsNumber({}, { message: 'El valor de venta debe ser numérico' })
  mtoValorVenta: number;

  @IsNumber({}, { message: 'La base del IGV debe ser numérica' })
  mtoBaseIgv: number;

  @IsNumber({}, { message: 'El porcentaje de IGV debe ser numérico' })
  porcentajeIgv: number;

  @IsNumber({}, { message: 'El IGV debe ser numérico' })
  igv: number;

  @IsNumber({}, { message: 'El tipo de afectación de IGV debe ser numérico' })
  tipAfeIgv: number;

  @IsNumber({}, { message: 'El total de impuestos debe ser numérico' })
  totalImpuestos: number;

  @IsNumber({}, { message: 'El precio unitario debe ser numérico' })
  mtoPrecioUnitario: number;
}
