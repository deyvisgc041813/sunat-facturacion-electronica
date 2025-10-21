import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { AddressDto } from './addres.dto';

export class ClienteDto {
  @IsString()
  @IsNotEmpty({ message: 'Tipo documento es obligatorio' })
  @IsIn(['1', '6'], {
    message: 'El tipo de documento debe ser 1 (DNI) o 6 (RUC)',
  })
  tipoDoc: string;

  @IsString()
  @IsNotEmpty({ message: 'Numero documento es obligatorio' })
  @Matches(/^\d{8}$|^\d{11}$/, {
    message:
      'El número de documento debe tener 8 dígitos (DNI) o 11 dígitos (RUC)',
  })
  numDoc: string;

  @IsNotEmpty({
    message: 'La razón social o el nombre del cliente es obligatoria',
  })
  @IsString({
    message: 'La razón social o el nombre del cliente debe ser un texto',
  })
  @Length(2, 250, {
    message: 'La razón social o el nombre debe tener entre 2 y 250 caracteres',
  })
  rznSocial: string;
  @ValidateIf((o) => o.tipoDoc === '6')
  @IsNotEmpty({
    message: 'El estado del RUC es obligatorio para documentos tipo RUC (6).',
  })
  @IsString({ message: 'El estado del RUC debe ser un texto.' })
  rucEstado: string;

  @ValidateIf((o) => o.tipoDoc === '6')
  @IsNotEmpty({
    message: 'La condición del domicilio fiscal es obligatoria para RUC (6).',
  })
  @IsString({ message: 'La condición del domicilio fiscal debe ser un texto.' })
  rucCondicion?: string;
  @IsOptional()
  @MaxLength(9, {
    message: 'El teléfono no puede tener más de 9 dígitos',
  })
  @Matches(/^[0-9]*$/, {
    message: 'El teléfono solo debe contener números',
  })
  telefono: string;
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido.' })
  correo?: string;

  @IsOptional() // en boleta puede faltar
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  constructor(partial?: Partial<ClienteDto>) {
    Object.assign(this, partial);
  }
}
