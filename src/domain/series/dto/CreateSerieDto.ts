import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString} from "class-validator";

export class CreateSerieDto {
  @Type(() => Number)
  @IsInt({ message: 'El sucursalId debe ser un número entero' })
  @IsNotEmpty({ message: 'La sucursal es obligatoria' })
  sucursalId: number;

  @IsString({ message: 'El comprobante debe ser texto' })
  @IsNotEmpty({ message: 'El comprobante es obligatorio' })
  tipoComprobante: string;

  @IsString({ message: 'La serie debe ser texto' })
  @IsNotEmpty({ message: 'La serie es obligatoria' })
  serie: string;

  @IsNumber()
  @IsOptional()
  correlativoInicial?: number;
  constructor(partial?: Partial<CreateSerieDto>) {
    Object.assign(this, partial);
  }
}
