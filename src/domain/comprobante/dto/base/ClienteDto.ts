import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { AddressDto } from './AddressDto';

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

@IsNotEmpty({ message: 'La razón social o el nombre del cliente es obligatoria' })
@IsString({ message: 'La razón social o el nombre del cliente debe ser un texto' })
@Length(2, 250, { message: 'La razón social o el nombre debe tener entre 2 y 250 caracteres' })
  rznSocial: string;

  @IsOptional() // en boleta puede faltar
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  constructor(partial?: Partial<ClienteDto>) {
    Object.assign(this, partial);
  }
}
