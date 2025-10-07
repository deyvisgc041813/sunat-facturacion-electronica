import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEmail,
  Length,
  IsInt,
  IsPositive,
  IsNumberString,
  IsIn,
  IsEmpty,
} from 'class-validator';

export class CreateSucursalDto {
  @Type(() => Number) //convierte string a number
  @IsInt({ message: 'El campo empresaId debe ser un número entero' })
  @IsNotEmpty({ message: 'La empresa es obligatorio' })
  @IsPositive({ message: 'El campo empresaId debe ser mayor a 0' })
  empresaId: number;
  @Type(() => Number) //convierte string a number
  @IsInt({ message: 'El campo distritoId debe ser un número entero' })
  @IsNotEmpty({ message: 'El distrito es obligatorio' })
  distritoId: number;
  @IsOptional()
  codigo: string;
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser un texto' })
  @Length(1, 100, { message: 'El nombre debe tener entre 1 y 100 caracteres' })
  nombre: string;
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @IsString({ message: 'La dirección debe ser un texto' })
  @Length(1, 255, {
    message: 'La dirección debe tener entre 1 y 255 caracteres',
  })
  direccion: string;

  @IsOptional()
  @IsNumberString({}, { message: 'El ubigeo debe ser un número de 6 dígitos' })
  @Length(6, 6, { message: 'El ubigeo debe tener exactamente 6 dígitos' })
  ubigeo?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto' })
  @Length(1, 20, { message: 'El teléfono debe tener máximo 20 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo debe tener un formato válido' })
  @Length(1, 100, { message: 'El correo debe tener máximo 100 caracteres' })
  email?: string;

  @IsString({ message: 'El signatureId debe ser un texto' })
  @Length(1, 50, { message: 'El signatureId debe tener máximo 50 caracteres' })
  @IsNotEmpty({ message: 'El signatureId es obligatorio' })
  signatureId?: string;

  @IsOptional()
  @IsString({ message: 'El signatureNote debe ser un texto' })
  @Length(1, 100, {
    message: 'El signatureNote debe tener máximo 100 caracteres',
  })
  signatureNote?: string;
  @IsString({
    message: 'El codigo de establecimiento de la sucursal debe ser un texto',
  })
  @Length(1, 4, {
    message:
      'El codigo de establecimiento de la sucursal debe tener máximo 4 caracteres',
  })
  @IsNotEmpty({
    message: 'El codigo de establecimiento de la sucursal es obligatorio',
  })
  codigoEstablecimiento: string;
  @IsNotEmpty({ message: 'El campo entorno es obligatorio' })
  @IsString({ message: 'El campo entorno debe ser un texto válido' })
  @IsIn(['BETA', 'PRODUCCION'], {
    message: 'El entorno solo puede ser BETA o PRODUCCION',
  })
  readonly entorno: string = 'BETA';
  @IsOptional()
  usuarioRegistro: string;
  @IsOptional()
  usuarioModificacion: string;
  @IsOptional()
  fechaModificacion: Date;
}
