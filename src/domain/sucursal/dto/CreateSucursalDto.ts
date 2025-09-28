import { 
  IsString, 
  IsOptional, 
  IsNotEmpty, 
  IsEmail, 
  Length, 
  IsInt, 
  IsPositive, 
  IsNumberString 
} from 'class-validator';

export class CreateSucursalDto {
  @IsInt({ message: 'El campo empresaId debe ser un número entero' })
  @IsPositive({ message: 'El campo empresaId debe ser mayor a 0' })
  empresaId: number;

  @IsString({ message: 'El código debe ser un texto' })
  //@IsNotEmpty()
  @Length(1, 10, { message: 'El código debe tener entre 1 y 10 caracteres' })
  codigo: string;
  @IsNotEmpty({message: 'El nombre es obligatorio'})
  @IsString({ message: 'El nombre debe ser un texto' })
  @Length(1, 100, { message: 'El nombre debe tener entre 1 y 100 caracteres' })
  nombre: string;
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @IsString({ message: 'La dirección debe ser un texto' })
  @Length(1, 255, { message: 'La dirección debe tener entre 1 y 255 caracteres' })
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
  @Length(1, 100, { message: 'El signatureNote debe tener máximo 100 caracteres' })
  signatureNote?: string
  @IsOptional()
  codigoEstablecimientoSunat:string
}
