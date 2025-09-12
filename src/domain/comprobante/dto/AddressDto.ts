import { IsString, IsNotEmpty, Length } from 'class-validator';

export class AddressDto {
  @IsString()
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  direccion: string;

  @IsString()
  @IsNotEmpty({ message: 'La provincia es obligatoria' })
  provincia: string;

  @IsString()
  @IsNotEmpty({ message: 'El departamento es obligatorio' })
  departamento: string;

  @IsString()
  @IsNotEmpty({ message: 'El distrito es obligatorio' })
  distrito: string;

  @IsString()
  @Length(6, 6, { message: 'El ubigeo debe tener exactamente 6 caracteres' })
  ubigueo: string;
}
