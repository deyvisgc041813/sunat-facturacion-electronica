import {
  IsString,
  IsInt,
  Matches,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { CronTaskType } from 'src/util/catalogo.enum';

export class CreateCronJobDto {
  @IsInt()
  @IsOptional()
  empresaId: number;

  @IsEnum(CronTaskType, {
    message: `El tipo de tarea no es válido. Debe ser uno de: ${Object.values(CronTaskType).join(', ')}`,
  })
  tipo: CronTaskType;

  // Acepta formato HH:mm
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Formato de hora inválido (usa HH:mm)',
  })
  horaEjecucion: string;

  @IsOptional()
  @IsBoolean()
  repetir?: boolean = true;

  @IsOptional()
  payload?: Record<string, any>;
  @IsOptional()
  proximaEjecucion?: any;
}
