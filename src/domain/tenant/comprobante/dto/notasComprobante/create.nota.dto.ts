import { Type } from 'class-transformer';
import {
  ValidateNested,
  IsArray,
  IsOptional,
  IsNotEmptyObject,
  IsDate,
  Validate,
} from 'class-validator';
import { ClienteDto } from '../base/client.dto';
import { CompanyDto } from '../base/company.dto';
import { DetailDto } from '../base/detail.dto';
import { LegendDto } from '../base/legend.dto';
import { ComprobanteBaseDto } from '../base/comprobante-base.dto';
import { DocumentoRelacionadoDto } from './documento-relacionado.dto';
import { MotivoNotaDto } from './motivo-nota.dto';
import { DescuentoGlobales } from './descuento-globales.dto';

export class CreateNotaDto extends ComprobanteBaseDto {
  @IsNotEmptyObject(
    {},
    { message: 'El nodo cliente es obligatorio y no puede estar vacío' },
  )
  @ValidateNested({ message: 'Los datos del cliente no son válidos' })
  @Type(() => ClienteDto)
  client: ClienteDto;
  @IsNotEmptyObject(
    {},
    { message: 'El nodo empresa es obligatorio y no puede estar vacío' },
  )
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
  @Type(() => DescuentoGlobales)
  descuentoGlobal: DescuentoGlobales[];

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
  telefonoEmpresa:string
  @IsOptional()
  correoEmpresa:string
  @IsOptional()
  signatureId:string
  @IsOptional()
  signatureNote:string
  @IsOptional()
  codigoEstablecimiento:string
  @IsOptional()
  descuentosGlobales: any[]
}
