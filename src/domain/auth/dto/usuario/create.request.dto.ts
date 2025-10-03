import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  isEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Any } from 'typeorm';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  @IsEmail({}, { message: 'Debe ser un correo válido' })
  correo: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  clave: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsArray({ message: 'Los roles deben ser un arreglo' })
  @IsInt({ each: true, message: 'Cada rol debe ser un número entero' })
  @Type(() => Any)
  roles: any[];

  @IsArray({ message: 'Las sucursales deben ser un arreglo' })
  @IsInt({ each: true, message: 'Cada sucursal debe ser un número entero' })
  @Type(() => Any)
  sucursales: any[];

  constructor(partial?: Partial<CreateUsuarioDto>) {
    Object.assign(this, partial);
  }
}
