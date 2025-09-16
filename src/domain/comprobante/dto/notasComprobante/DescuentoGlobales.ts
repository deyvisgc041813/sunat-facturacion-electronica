import {
  IsNumber,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DescuentoGlobales {
  @Type(() => Number)
  @IsNumber(
    {},
    { message: 'El monto base de descuento global debe ser numérico' },
  )
  @Min(0, {
    message: 'El monto base de descuento global no puede ser negativo',
  })
  montoBase: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'El monto global debe ser numérico' })
  @Min(0, { message: 'El monto global no puede ser negativo' })
  monto: number;
  @IsIn(['00'], {
    message:
      "El código de descuento global debe ser '00' según SUNAT (Catálogo 53)",
  })
  codigo: string;

  constructor(partial?: Partial<DescuentoGlobales>) {
    Object.assign(this, partial);
  }
}
