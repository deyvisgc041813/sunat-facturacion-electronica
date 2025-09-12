import { Type } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { AddressDto } from "./AddressDto";

export class ClienteDto {
  @IsString()
  @IsNotEmpty({message: "Tipo documento es obligatorio"})
  tipoDoc: string;

  @IsString()
  @IsNotEmpty({message: "Numero documento es obligatorio"})
  numDoc: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre o razón social es obligatorio' })
  rznSocial: string;

  @IsOptional() // en boleta puede faltar
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  constructor(partial?: Partial<ClienteDto>) {
    Object.assign(this, partial);
  }
}
