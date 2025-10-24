import { IsString, IsNotEmpty, Length, IsOptional } from 'class-validator';

export class AddressDto {
  @IsOptional()
  @IsString()
  // @IsNotEmpty({ message: 'La dirección es obligatoria' })
  direccion: string;
  @IsOptional()
  @IsString()
  // @IsNotEmpty({ message: 'La provincia es obligatoria' })
  provincia: string;
  @IsOptional()
  @IsString()
  // @IsNotEmpty({ message: 'El departamento es obligatorio' })
  departamento: string;
  @IsOptional()
  @IsString()
  // @IsNotEmpty({ message: 'El distrito es obligatorio' })
  distrito: string;
  @IsOptional()
  @IsString()
  //@Length(6, 6, { message: 'El ubigeo debe tener exactamente 6 caracteres' })
  ubigueo: string;
}
