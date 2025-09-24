import { Type } from 'class-transformer';
import {
  IsNumber,
  ValidateNested,
  IsArray,
  IsOptional,
} from 'class-validator';
import { FormaPagoDto } from '../base/FormaPagoDto';
import { ClienteDto } from '../base/ClienteDto';
import { CompanyDto } from '../base/CompanyDto';
import { DetailDto } from '../base/DetailDto';
import { LegendDto } from '../base/LegendDto';
import { ComprobanteBaseDto } from '../base/ComprobanteBaseDto';

export class CreateInvoiceDto extends ComprobanteBaseDto {

  @ValidateNested({ message: 'Los datos de forma de pago no son válidos' })
  @Type(() => FormaPagoDto)
  formaPago: FormaPagoDto;

  @ValidateNested({ message: 'Los datos del cliente no son válidos' })
  @Type(() => ClienteDto)
  client: ClienteDto;

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
  errorReference:string
    // @IsString({ message: 'La versión UBL debe ser un texto' })
  // @IsNotEmpty({ message: 'La versión UBL es obligatoria' })
  // ublVersion: string;

  // @IsString({ message: 'El tipo de operación debe ser un texto' })
  // @IsNotEmpty({ message: 'El tipo de operación es obligatorio' })
  // tipoOperacion: string;

  // @IsString({ message: 'El tipo comprobante debe ser un texto' })
  // @IsNotEmpty({ message: 'El tipo comprobante es obligatorio' })
  // tipoComprobante: string;

  // @IsString({ message: 'La serie debe ser un texto' })
  // @IsNotEmpty({ message: 'La serie es obligatoria' })
  // serie: string;
  // @IsNumber({}, { message: 'El correlativo debe ser numérico' })
  // @IsNotEmpty({ message: 'El correlativo es obligatorio' })
  // correlativo: number;

  // @IsISO8601(
  //   {},
  //   { message: 'La fecha de emisión debe tener formato ISO8601 (YYYY-MM-DD)' },
  // )
  // fechaEmision: string;

    // @IsString({ message: 'El tipo de moneda debe ser un texto' })
  // @IsNotEmpty({ message: 'El tipo de moneda es obligatorio' })
  // tipoMoneda: string;

  // @IsNumber(
  //   {},
  //   { message: 'El monto de operaciones gravadas debe ser numérico' },
  // )
  // @Min(0, { message: 'El monto de operaciones gravadas no puede ser negativo' })
  // mtoOperGravadas: number;

  // @IsNumber(
  //   {},
  //   { message: 'El monto de operaciones exoneradas debe ser numérico' },
  // )
  // @Min(0, {
  //   message: 'El monto de operaciones exoneradas no puede ser negativo',
  // })
  // mtoOperExoneradas: number;

  // @IsNumber(
  //   {},
  //   { message: 'El monto de operaciones inafectas debe ser numérico' },
  // )
  // @Min(0, {
  //   message: 'El monto de operaciones inafectas no puede ser negativo',
  // })
  // mtoOperInafectas: number;

  // @IsNumber({}, { message: 'El monto de IGV debe ser numérico' })
  // mtoIGV: number;

  // @IsNumber({}, { message: 'El subtotal debe ser numérico' })
  // subTotal: number;

  // @IsNumber({}, { message: 'El monto de importe de venta debe ser numérico' })
  // mtoImpVenta: number;
}
