import { IsString, IsInt, Matches, IsOptional, IsBoolean } from 'class-validator';

export class CreateCronJobDto {
  @IsInt()
  @IsOptional()
  empresaId: number;

  @IsString()
  tipo: string;

  // Acepta formato HH:mm
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (usa HH:mm)' })
  horaEjecucion: string;

  @IsOptional()
  @IsBoolean()
  repetir?: boolean = true;

  @IsOptional()
  payload?: Record<string, any>;
  @IsOptional()
  proximaEjecucion?:any
}
