import { Type } from "class-transformer";
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches } from "class-validator";

export class CreateClienteDto {
  @Type(() => Number) //convierte string a number
  @IsInt({ message: 'El empresaId debe ser un número entero' })
  @IsNotEmpty({ message: 'La empresa es obligatorio' })
  empresaId: number;

  @IsString()
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio' })
  @Length(1, 2, { message: 'El tipo de documento debe tener máximo 2 caracteres' })
  tipoDocumento: string;

  @IsString()
  @IsNotEmpty({ message: 'El número de documento es obligatorio' })
  @Length(8, 15, { message: 'El número de documento debe tener entre 8 y 15 dígitos' })
  numeroDocumento: string;

  @IsString()
  @IsOptional()
  razonSocial: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo no es válido' })
  correo?: string;

  @IsOptional()
  @Matches(/^[0-9+\-() ]+$/, { message: 'El teléfono contiene caracteres inválidos' })
  telefono?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellidoPaterno?: string;

  @IsOptional()
  @IsString()
  apellidoMaterno?: string;

  @IsOptional()
  @IsString()
  estadoComtribuyente?: string;

  @IsOptional()
  @IsString()
  condicionDomicilio?: string;

  constructor(partial?: Partial<CreateClienteDto>) {
    Object.assign(this, partial);
  }
}