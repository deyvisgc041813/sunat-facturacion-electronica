import { Expose, Transform, Type } from 'class-transformer';
import {
  IsNumber,
  ValidateNested,
  IsArray,
  IsOptional,
  IsNotEmptyObject,
  IsISO8601,
} from 'class-validator';
import { FormaPagoDto } from '../base/forma-pago.dto';
import { ClienteDto } from '../base/client.dto';
import { CompanyDto } from '../base/company.dto';
import { DetailDto } from '../base/detail.dto';
import { LegendDto } from '../base/legend.dto';
import { ComprobanteBaseDto } from '../base/comprobante-base.dto';

export class CreateInvoiceDto extends ComprobanteBaseDto {
  @IsNotEmptyObject({}, { message: 'El nodo formaPago es obligatorio' })
  @ValidateNested({ message: 'Los datos de forma de pago no son válidos' })
  @Type(() => FormaPagoDto)
  formaPago: FormaPagoDto;
  
  @IsISO8601(
    {},
    { message: 'La fecha de vencimiento debe tener formato ISO8601 (YYYY-MM-DD)' },
  )
  @Transform(({ value }) => String(value))
  fechaVencimiento: string;
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
  @IsOptional()
  telefonoEmpresa:string
  @IsOptional()
  correoEmpresa:string

  @IsOptional()
  signatureId:string
  @IsOptional()
  signatureNote:string
  @IsOptional()
  codigoEstablecimiento:string
}
