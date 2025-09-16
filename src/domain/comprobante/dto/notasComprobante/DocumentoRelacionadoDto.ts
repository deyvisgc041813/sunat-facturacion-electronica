import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class DocumentoRelacionadoDto {
  @IsString({ message: "El tipo de comprobante relacionado debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El tipo de comprobante relacionado es obligatorio" })
  tipoComprobante: string;

  @IsString({ message: "La serie del documento relacionado debe ser una cadena de texto" })
  @IsNotEmpty({ message: "La serie del documento relacionado es obligatoria" })
  serie: string;

  @IsInt({ message: "El correlativo del documento relacionado debe ser un número entero" })
  @IsNotEmpty({ message: "El correlativo del documento relacionado es obligatorio" })
  correlativo: number;

  constructor(partial?: Partial<DocumentoRelacionadoDto>) {
    Object.assign(this, partial);
  }
}
