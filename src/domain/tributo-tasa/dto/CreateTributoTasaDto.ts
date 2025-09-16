import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';

export class CreateTributoTasaDto {
  @IsString()
  @Length(1, 10, { message: 'El código SUNAT debe tener entre 1 y 10 caracteres' })
  codigoSunat: string; // Ej: 1000, 2000, 6030

  @IsString()
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  nombre: string; // Ej: IGV, ISC, ICBPER

  @IsOptional()
  @IsNumber({}, { message: 'La tasa debe ser un número' })
  @Min(0, { message: 'La tasa no puede ser negativa' })
  tasa?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(0, { message: 'El monto no puede ser negativo' })
  monto?: number;

  @IsString()
  @IsNotEmpty({ message: 'La moneda es obligatorio' })
  @Length(3, 3, { message: 'La moneda debe tener 3 caracteres (ejemplo: PEN, USD)' })
  moneda: string;

  @IsDateString({}, { message: 'La vigencia desde debe tener formato YYYY-MM-DD' })
  vigenciaDesde: string;

  @IsOptional()
  @IsDateString({}, { message: 'La vigencia hasta debe tener formato YYYY-MM-DD' })
  vigenciaHasta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'La observación no puede superar 255 caracteres' })
  observacion?: string;
}
