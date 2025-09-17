import { Type } from 'class-transformer';
import {
  ValidateNested,
  IsArray,
  IsOptional,
  IsNumber,
  Min,
  IsNotEmptyObject,
  IsDate,
} from 'class-validator';
import { FormaPagoDto } from '../base/FormaPagoDto';
import { ClienteDto } from '../base/ClienteDto';
import { CompanyDto } from '../base/CompanyDto';
import { DetailDto } from '../base/DetailDto';
import { LegendDto } from '../base/LegendDto';
import { ComprobanteBaseDto } from '../base/ComprobanteBaseDto';
import { DocumentoRelacionadoDto } from './DocumentoRelacionadoDto';
import { MotivoNotaDto } from './MotivoNotaDto';
import { DescuentoGlobales } from './DescuentoGlobales';

export class CreateNotaDto extends ComprobanteBaseDto {
  @ValidateNested({ message: 'Los datos de forma de pago no son válidos' })
  @Type(() => FormaPagoDto)
  formaPago: FormaPagoDto;

  @ValidateNested({ message: 'Los datos del cliente no son válidos' })
  @Type(() => ClienteDto)
  client: ClienteDto;

  @ValidateNested({ message: 'Los datos de la empresa no son válidos' })
  @Type(() => CompanyDto)
  company: CompanyDto;
  @IsNotEmptyObject(
    {},
    { message: 'El nodo documento relacionado es obligatorio y no puede estar vacío' },
  )
  @ValidateNested({
    message: 'Los datos de documentos relacionado no son validos',
  })
  @Type(() => DocumentoRelacionadoDto)
  documentoRelacionado: DocumentoRelacionadoDto;
  @IsNotEmptyObject(
    {},
    { message: 'El nodo motivo es obligatorio y no puede estar vacío' },
  )
  @ValidateNested({
    message: 'Los datos del motivo de nota credito no son validos',
  })
  @Type(() => MotivoNotaDto)
  motivo: MotivoNotaDto;

  @IsOptional()
  @IsArray({ message: 'Los descuentos globales deben ser un arreglo' })
  @ValidateNested({
    each: true,
    message: 'Los descuentos globales no son válidos',
  })
  @Type(() => DetailDto)
  descuentosGlobales: DescuentoGlobales[];
  @IsOptional()
  @IsNumber({}, { message: 'El monto de descuento global debe ser numérico' })
  @Min(0, { message: 'El monto de descuento global no puede ser negativo' })
  descuentoGlobal: number;
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'La fecha de pago debe ser una fecha válida (YYYY-MM-DD)' })
  fechaPago?: Date;
  @IsOptional()
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
  porcentajeIgv: number; // solo se usara a nivel de backend
}
