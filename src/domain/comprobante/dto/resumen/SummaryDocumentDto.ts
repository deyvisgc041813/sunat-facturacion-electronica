import {
  IsString,
  IsNotEmpty,
  IsDateString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentoDto } from './DocumentoDto';
import { CompanyDto } from '../CompanyDto';

export class SummaryDocumentDto {
  @IsString({ message: 'UBLVersion debe ser texto' })
  @IsNotEmpty({ message: 'UBLVersion es obligatorio' })
  ublVersion: string;

  @IsString({ message: 'CustomizationID debe ser texto' })
  @IsNotEmpty({ message: 'CustomizationID es obligatorio' })
  customizationID: string;

  @IsString({ message: 'ID debe ser texto' })
  @IsNotEmpty({ message: 'El id del resumen es obligatorio' })
  resumenId: string;
  
  @IsDateString({}, { message: 'Fecha generación debe ser una fecha válida' }) // fecha de emision de los comprobantes
  fecGeneracion: string;

  @IsDateString({}, { message: 'Fecha de resumen debe ser una fecha válida' }) // fecha de generacion del resumen. (fecha del envio del resumen)
  fecResumen: string;

  @ValidateNested()
  @Type(() => CompanyDto)
  company: CompanyDto;

  @IsArray({ message: 'documentos debe ser un arreglo' })
  @ValidateNested({ each: true })
  
  @Type(() => DocumentoDto)
  documentos: DocumentoDto[];
}
