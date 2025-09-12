import { IsString, IsNotEmpty } from 'class-validator';

export class LegendDto {
  @IsString({ message: 'El código de la leyenda debe ser un texto' })
  @IsNotEmpty({ message: 'El código de la leyenda es obligatorio' })
  code: string;

  @IsString({ message: 'El valor de la leyenda debe ser un texto' })
  @IsNotEmpty({ message: 'El valor de la leyenda es obligatorio' })
  value: string;
}
