import { IsString, IsNotEmpty, IsOptional, Length, ValidateNested, Matches, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto } from './AddressDto';


export class CompanyDto {
  @IsString({ message: 'El RUC de la empresa debe ser texto' })
  @Length(11, 11, { message: 'El RUC de la empresa debe tener exactamente 11 dígitos' })
  @Matches(/^\d+$/, { message: 'El RUC de la empresa solo debe contener dígitos' })
  ruc: string;

  @IsString({ message: 'La razón social de la empresa debe ser un texto' })
  @IsNotEmpty({ message: 'La razón social de la empresa es obligatoria' })
  razonSocial: string;

  @IsOptional()
  @IsString({ message: 'El nombre comercial de la empresa debe ser un texto' })
  nombreComercial?: string;
  
  @IsString({ message: 'El tipo de documento de la empresa debe ser un texto' })
  @IsNotEmpty({ message: 'El tipo de documento de la empresa es obligatorio' })
  @IsIn(['6'], { message: 'El tipo de documento de la empresa siempre debe ser 6 (RUC)' })
  tipoDoc: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
