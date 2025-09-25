import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsSunatDateTime } from 'src/util/is-sunat-datetime.decorator';
import { CompanyDto } from '../comprobante/dto/base/CompanyDto';
export class ComunicacionBajaDto {
  @IsString()
  @IsNotEmpty({ message: 'La versión UBL es obligatoria' })
  @Matches(/^2\.0$/, { message: 'La versión UBL debe ser "2.0"' })
  ublVersion: string;

  @IsString()
  @IsNotEmpty({ message: 'El CustomizationID es obligatorio' })
  @Matches(/^1\.0$/, { message: 'El CustomizationID debe ser "1.0"' })
  customizationId: string;

  @IsString()
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio' })
  @Matches(/^RA$/, { message: 'El tipo de documento debe ser RA' })
  tipoDocumento: string; // siempre "RA"

  @IsNotEmpty({ message: 'La fecha de referencia es obligatoria' })
  @IsSunatDateTime({
    message:
      'La fecha de referencia debe tener el formato: YYYY-MM-DDTHH:mm:ss o YYYY-MM-DDTHH:mm:ss±HH:mm (ejemplo: 2025-09-11T14:26:13 o 2025-09-11T14:26:13-05:00)',
  })
  fecReferencia: string;

  @ValidateNested({ message: 'La empresa emisora es obligatoria' })
  @Type(() => CompanyDto)
  company: CompanyDto;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComunicacionBajaDetalleDto)
  detalles: ComunicacionBajaDetalleDto[];
  // @IsOptional()
  // errorReference?: string;
}

export class ComunicacionBajaDetalleDto {
  @IsInt({ message: 'El comprobanteId debe ser un número entero válido' })
  @Min(1, { message: 'El comprobanteId debe ser mayor a cero' })
  comprobanteId: number;

  @IsString()
  @IsNotEmpty({
    message:
      'Debes indicar el tipo de comprobante (ej. 01=Factura, 07=Nota de crédito, 08=Nota de débito)',
  })
  @IsIn(['01', '07', '08'], {
    message:
      'El tipo de comprobante solo puede ser 01 (Factura), 07 (Nota de crédito) o 08 (Nota de débito)',
  })
  tipoComprobante: string;

  @IsString()
  @IsNotEmpty({
    message: 'Por favor ingresa la serie del comprobante (ejemplo: F001, B001)',
  })
  serie: string;

  @IsInt({ message: 'El correlativo debe ser un número entero válido' })
  @Min(1, { message: 'El correlativo debe ser mayor a cero' })
  correlativo: number;

  @IsString()
  @IsNotEmpty({
    message:
      'Es necesario indicar el motivo de la baja para continuar con el registro',
  })
  motivo: string;
}
