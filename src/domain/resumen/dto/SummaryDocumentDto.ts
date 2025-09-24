import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CompanyDto } from '../../comprobante/dto/base/CompanyDto';
import { IsSunatDateTime } from 'src/util/is-sunat-datetime.decorator';

export class SummaryDocumentDto {
  @IsString()
  @IsNotEmpty({ message: 'La versión UBL es obligatoria' })
  @Matches(/^2\.0$/, { message: 'La versión UBL debe ser "2.0"' })
  ublVersion: string;

  @IsString()
  @IsNotEmpty({ message: 'El CustomizationID es obligatorio' })
  @Matches(/^1\.1$/, { message: 'El CustomizationID debe ser "1.1"' })
  customizationID: string;
  @IsString({ message: 'La serie del resumen debe ser un texto válido' })
  @IsNotEmpty({ message: 'La serie del resumen es obligatoria' })
  @Matches(/^RC$/, {
    message: 'La serie del resumen solo puede tener el valor "RC"',
  })
  serieResumen: string;

  @IsNotEmpty({ message: 'La fecha de referencia es obligatoria' })
  @IsSunatDateTime({
    message:
      'La fecha de referencia debe tener el formato: YYYY-MM-DDTHH:mm:ss o YYYY-MM-DDTHH:mm:ss±HH:mm (ejemplo: 2025-09-11T14:26:13 o 2025-09-11T14:26:13-05:00)',
  })
  fecReferencia: string;

  @ValidateNested({ message: 'La empresa emisora es obligatoria' })
  @Type(() => CompanyDto)
  company: CompanyDto;
  @IsOptional()
  @IsString()
  serie?: string;
}
