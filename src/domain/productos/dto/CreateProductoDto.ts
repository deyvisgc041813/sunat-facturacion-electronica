import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, IsNumber, IsBoolean } from "class-validator";

export class CreateProductoDto {
  
  @Type(() => Number) // convierte string a number
  @IsInt({ message: 'El sucursalId debe ser un número entero' })
  @IsNotEmpty({ message: 'La sucursal es obligatoria' })
  sucursalId: number;

  @IsString({ message: 'El código debe ser texto' })
  @IsNotEmpty({ message: 'El código es obligatorio' })
  @Length(1, 50, { message: 'El código debe tener entre 1 y 50 caracteres' })
  codigo: string;

  @IsString({ message: 'La descripción debe ser texto' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  descripcion: string;

  @IsString({ message: 'La unidad de medida debe ser texto' })
  @IsNotEmpty({ message: 'La unidad de medida es obligatoria' })
  @Length(2, 5, { message: 'La unidad de medida debe tener máximo 5 caracteres' })
  unidadMedida: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio unitario debe ser numérico con máximo 2 decimales' })
  @IsNotEmpty({ message: 'El precio unitario es obligatorio' })
  precioUnitario: number;

  @Type(() => Boolean)
  @IsBoolean({ message: 'El campo afecta_igv debe ser booleano' })
  @IsOptional()
  afectaIgv?: boolean;

  constructor(partial?: Partial<CreateProductoDto>) {
    Object.assign(this, partial);
  }
}
