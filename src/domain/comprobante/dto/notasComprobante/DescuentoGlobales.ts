// import { IsNumber, Min, IsIn, IsString, IsNotEmpty, IsPositive } from 'class-validator';
// import { Type } from 'class-transformer';

// export class DescuentoGlobales {
//   @IsNumber(
//     {},
//     { message: 'El monto base de descuento global debe ser numérico' },
//   )
//   @IsIn([0], { message: 'El monto base de descuento global debe ser 0' })
//   montoBase: number;
//   @IsString()
//   @IsNotEmpty({ message: 'La descripción es obligatoria' })
//   descripcion: string;
//   @Type(() => Number)
//   @IsNumber({}, { message: 'El monto global debe ser numérico' })
//   @IsPositive({ message: 'El monto global debe ser mayor a 0' })
//   monto: number;
//   @IsIn(['00'], {
//     message:
//       "El código de descuento global debe ser '00' según SUNAT (Catálogo 53)",
//   })
//   codigo: string;

//   constructor(partial?: Partial<DescuentoGlobales>) {
//     Object.assign(this, partial);
//   }
// }

import { IsNumber, IsString, IsNotEmpty, IsPositive, Equals, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class DescuentoGlobales {
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto base de descuento global debe ser numérico' })
  @Equals(0, { message: 'El monto base de descuento global siempre debe ser 0 según SUNAT' })
  montoBase: number;

  @IsString({ message: 'La descripción debe ser un texto' })
  @IsNotEmpty({ message: 'La descripción del descuento global es obligatoria' })
  descripcion: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'El monto global debe ser numérico' })
  @IsPositive({ message: 'El monto global debe ser mayor a 0' })
  monto: number;

  @IsString({ message: 'El código debe ser un texto' })
  @IsIn(['00'], { message: "El código de descuento global debe ser '00' según SUNAT (Catálogo 53)" })
  codigo: string;

  constructor(partial?: Partial<DescuentoGlobales>) {
    Object.assign(this, partial);
  }
}
