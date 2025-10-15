import { IsNumber, Min, IsString, IsNotEmpty } from 'class-validator';

export class PagoDto {
  @IsNumber({}, { message: 'monto debe ser numérico' })
  @Min(0, { message: 'monto no puede ser negativo' })
  monto: number;

  @IsString({ message: 'tipo debe ser texto' })
  @IsNotEmpty({ message: 'tipo es obligatorio' })
  tipo: string;
}
