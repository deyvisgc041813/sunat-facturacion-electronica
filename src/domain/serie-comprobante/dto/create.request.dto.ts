import { Expose, Transform, Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString} from "class-validator";

export class CreateSerieDto {
  @Expose({ name: 'branch_id' })
  @Transform(({ value }) => Number(value))
  @IsNotEmpty({ message: 'El branch_id es obligatorio' })
  @Type(() => Number)
  @IsInt({ message: 'El branch_id debe ser un número entero' })
  sucursalId: number;

  @Expose({ name: 'tipo_doc' })
  @Transform(({ value }) => String(value))
  @IsString({ message: 'La tipo documento debe ser texto' })
  @IsNotEmpty({ message: 'El tipo documento es obligatorio' })
  tipoComprobante: string;

  @IsString({ message: 'La serie debe ser texto' })
  @IsNotEmpty({ message: 'La serie es obligatoria' })
  serie: string;

  @Expose({ name: 'correlativo_inicial' })
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsInt({ message: 'El correlativo_inicial debe ser un número entero' })
  correlativoInicial?: number;
  @IsOptional()
  usuarioRegistro:string
  constructor(partial?: Partial<CreateSerieDto>) {
    Object.assign(this, partial);
  }
}
