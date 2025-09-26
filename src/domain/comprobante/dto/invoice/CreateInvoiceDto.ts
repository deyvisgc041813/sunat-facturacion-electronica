import { Type } from 'class-transformer';
import {
  IsNumber,
  ValidateNested,
  IsArray,
  IsOptional,
  IsNotEmptyObject,
} from 'class-validator';
import { FormaPagoDto } from '../base/FormaPagoDto';
import { ClienteDto } from '../base/ClienteDto';
import { CompanyDto } from '../base/CompanyDto';
import { DetailDto } from '../base/DetailDto';
import { LegendDto } from '../base/LegendDto';
import { ComprobanteBaseDto } from '../base/ComprobanteBaseDto';

export class CreateInvoiceDto extends ComprobanteBaseDto {
  @IsNotEmptyObject({}, { message: 'El nodo formaPago es obligatorio' })
  @ValidateNested({ message: 'Los datos de forma de pago no son válidos' })
  @Type(() => FormaPagoDto)
  formaPago: FormaPagoDto;
  @IsNotEmptyObject({}, { message: 'El nodo client es obligatorio' })
  @ValidateNested({ message: 'Los datos del cliente no son válidos' })
  @Type(() => ClienteDto)
  client: ClienteDto;
  @IsNotEmptyObject({}, { message: 'El nodo company es obligatorio' })
  @ValidateNested({ message: 'Los datos de la empresa no son válidos' })
  @Type(() => CompanyDto)
  company: CompanyDto;
  
  @IsOptional()
  @IsNumber({}, { message: 'El monto de ICBPER debe ser numérico' })
  icbper: number;
  @IsArray({ message: 'Los detalles deben ser un arreglo' })
  @ValidateNested({ each: true, message: 'Los detalles no son válidos' })
  @Type(() => DetailDto)
  details: DetailDto[];
  
  @IsOptional()
  @IsArray({ message: 'Las leyendas deben ser un arreglo' })
  @ValidateNested({ each: true, message: 'Las leyendas no son válidas' })
  @Type(() => LegendDto)
  legends: LegendDto[];
}
