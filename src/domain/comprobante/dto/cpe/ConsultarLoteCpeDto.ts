import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDateString,
  ValidateNested,
  Min,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";

export class ConsultarLoteCpeDto {
  @IsArray({ message: "Debe enviar una lista de comprobantes" })
  @ValidateNested({ each: true })
  @Type(() => CpeDto)
  cpes: CpeDto[];
}

export class CpeDto {
  @IsString()
  @IsNotEmpty({ message: "El RUC es obligatorio" })
  @Matches(/^\d{11}$/, { message: "El RUC debe tener 11 dígitos numéricos" })
  ruc: string;

  @IsString()
  @IsNotEmpty({ message: "El tipo de comprobante es obligatorio" })
  @Matches(/^(01|03|07|08)$/, {
    message: "El tipo de comprobante debe ser 01, 03, 07 o 08",
  })
  tipo: string;

  @IsString()
  @IsNotEmpty({ message: "La serie y número son obligatorios" })
  @Matches(/^[A-Z0-9]{1,4}-\d{1,8}$/, {
    message: "La serie y número deben tener el formato correcto (ej. F001-000382)",
  })
  serieNumero: string;
  @IsNotEmpty({ message: "La serie y número son obligatorios" })
  @IsDateString({}, { message: "La fecha de emisión del comprobante debe tener formato YYYY-MM-DD" })
  fechaEmisionCpe: string;

  @IsNumber({}, { message: "El monto debe ser un número" })
  @Min(0, { message: "El monto debe ser mayor o igual a 0" })
  monto: number;
}