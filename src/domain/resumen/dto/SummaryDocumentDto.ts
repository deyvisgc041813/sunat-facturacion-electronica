import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CompanyDto } from '../../comprobante/dto/base/CompanyDto';
import { IsSunatDateTime } from 'src/util/is-sunat-datetime.decorator';

export class SummaryDocumentDto {
  @IsString({ message: 'UBLVersion debe ser texto' })
  @IsNotEmpty({ message: 'UBLVersion es obligatorio' })
  ublVersion: string;

  @IsString({ message: 'CustomizationID debe ser texto' })
  @IsNotEmpty({ message: 'CustomizationID es obligatorio' })
  customizationID: string;

  // @IsNotEmpty({ message: 'La fecha de generación es obligatoria' })
  // @IsSunatDateTime({
  //   message:
  //     'La fecha de generación debe tener el formato: YYYY-MM-DDTHH:mm:ss o YYYY-MM-DDTHH:mm:ss±HH:mm (ejemplo: 2025-09-11T14:26:13 o 2025-09-11T14:26:13-05:00)',
  // })
  // fecGeneracion: string;

  @IsNotEmpty({ message: 'La fecha de referencia es obligatoria' })
  @IsSunatDateTime({
    message:
      'La fecha de referencia debe tener el formato: YYYY-MM-DDTHH:mm:ss o YYYY-MM-DDTHH:mm:ss±HH:mm (ejemplo: 2025-09-11T14:26:13 o 2025-09-11T14:26:13-05:00)',
  })
  fecReferencia: string;

  @ValidateNested()
  @Type(() => CompanyDto)
  company: CompanyDto;
  @IsOptional()
  @IsString()
  serie?: string;
}
