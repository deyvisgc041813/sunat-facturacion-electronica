
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsISO8601,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { FormaPagoDto } from './FormaPagoDto';
import { ClienteDto } from './ClienteDto';
import { CompanyDto } from './CompanyDto';
import { DetailDto } from './DetailDto';
import { LegendDto } from './LegendDto';

export class CreateComprobanteDto {
  @IsString({ message: 'La versión UBL debe ser un texto' })
  @IsNotEmpty({ message: 'La versión UBL es obligatoria' })
  ublVersion: string;

  @IsString({ message: 'El tipo de operación debe ser un texto' })
  @IsNotEmpty({ message: 'El tipo de operación es obligatorio' })
  tipoOperacion: string;

  @IsString({ message: 'El tipo de documento debe ser un texto' })
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio' })
  tipoDoc: string;

  @IsString({ message: 'La serie debe ser un texto' })
  @IsNotEmpty({ message: 'La serie es obligatoria' })
  serie: string;

  @IsString({ message: 'El correlativo debe ser un texto' })
  @IsNotEmpty({ message: 'El correlativo es obligatorio' })
  correlativo: string;

  @IsISO8601({}, { message: 'La fecha de emisión debe tener formato ISO8601 (YYYY-MM-DD)' })
  fechaEmision: string;

  @ValidateNested({ message: 'Los datos de forma de pago no son válidos' })
  @Type(() => FormaPagoDto)
  formaPago: FormaPagoDto;

  @IsString({ message: 'El tipo de moneda debe ser un texto' })
  @IsNotEmpty({ message: 'El tipo de moneda es obligatorio' })
  tipoMoneda: string;

  @ValidateNested({ message: 'Los datos del cliente no son válidos' })
  @Type(() => ClienteDto)
  client: ClienteDto;

  @ValidateNested({ message: 'Los datos de la empresa no son válidos' })
  @Type(() => CompanyDto)
  company: CompanyDto;

  @IsNumber({}, { message: 'El monto de operaciones gravadas debe ser numérico' })
  mtoOperGravadas: number;

  @IsNumber({}, { message: 'El monto de IGV debe ser numérico' })
  mtoIGV: number;

  @IsNumber({}, { message: 'El valor de venta debe ser numérico' })
  valorVenta: number;

  @IsNumber({}, { message: 'El total de impuestos debe ser numérico' })
  totalImpuestos: number;

  @IsNumber({}, { message: 'El subtotal debe ser numérico' })
  subTotal: number;

  @IsNumber({}, { message: 'El monto de importe de venta debe ser numérico' })
  mtoImpVenta: number;

  @IsArray({ message: 'Los detalles deben ser un arreglo' })
  @ValidateNested({ each: true, message: 'Los detalles no son válidos' })
  @Type(() => DetailDto)
  details: DetailDto[];

  @IsArray({ message: 'Las leyendas deben ser un arreglo' })
  @ValidateNested({ each: true, message: 'Las leyendas no son válidas' })
  @Type(() => LegendDto)
  legends: LegendDto[];
}
