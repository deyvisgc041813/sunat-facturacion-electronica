import { IsOptional, IsIn, IsEnum } from 'class-validator';

export enum PdfFormatType {
  A4 = 'A4',
  TICKET = 'ticket',
}

export class PrintOptionsDto {
  @IsOptional()
  @IsIn(['1', '0'], { message: 'El campo "generatePdf" solo puede ser "1" (sí) o "0" (no).' })
  generatePdf?: string;

  @IsOptional()
  @IsEnum(PdfFormatType, { message: 'El campo "format" solo puede ser "A4" o "ticket".' })
  format?: PdfFormatType;
}
