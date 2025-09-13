import {
  IsNumber,
  IsNotEmpty,
  IsString,
  ValidateNested,
  Min,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClienteDto } from '../ClienteDto';
import { PagoDto } from './PagoDto';

export class DocumentoDto {
  @IsNumber({}, { message: 'linea debe ser numérico' })
  linea: number;

  @IsString({ message: 'tipoDocumento debe ser texto' })
  @IsNotEmpty({ message: 'tipoDocumento es obligatorio' })
  tipoDoc: string;

  @IsString({ message: 'serieNumero debe ser texto' })
  @IsNotEmpty({ message: 'serieNumero es obligatorio' })
  serieNumero: string;

  @ValidateNested()
  @Type(() => ClienteDto)
  cliente: ClienteDto;

  @IsString({ message: 'estado debe ser texto' })
  @IsNotEmpty({ message: 'estado es obligatorio' })
  estado: string;

  @IsNumber({}, { message: 'total debe ser numérico' })
  @Min(0, { message: 'total no puede ser negativo' })
  total: number;

  @IsArray({ message: 'pagos debe ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => PagoDto)
  pagos: PagoDto[];

  @IsNumber({}, { message: 'IGV debe ser numérico' })
  @Min(0, { message: 'IGV no puede ser negativo' })
  igv: number;
  @IsString({ message: 'El tipo de moneda debe ser un texto' })
  @IsNotEmpty({ message: 'El tipo de moneda es obligatorio' })
  tipoMoneda: string;
}
