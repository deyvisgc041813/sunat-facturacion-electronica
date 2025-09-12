import { IsString, IsNotEmpty, IsOptional, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto } from './AddressDto';


export class CompanyDto {
  @IsString({ message: 'El RUC debe ser un texto numérico' })
  @IsNotEmpty({ message: 'El RUC es obligatorio' })
  @Length(11, 11, { message: 'El RUC debe tener exactamente 11 dígitos' })
  ruc: string;

  @IsString({ message: 'La razón social debe ser un texto' })
  @IsNotEmpty({ message: 'La razón social es obligatoria' })
  razonSocial: string;

  @IsOptional()
  @IsString({ message: 'El nombre comercial debe ser un texto' })
  nombreComercial?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
