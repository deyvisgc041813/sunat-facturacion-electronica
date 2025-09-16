import { IsNotEmpty, IsString, Length } from "class-validator";
import { NotaCreditoMotivo } from "src/util/catalogo.enum";

export class MotivoNotaDto {
  @IsString({ message: "El código del motivo debe ser un texto" })
  @IsNotEmpty({ message: "El código del motivo es obligatorio" })
  @Length(2, 2, { message: "El código del motivo debe tener exactamente 2 caracteres" })
  codigo: NotaCreditoMotivo;

  @IsString({ message: "La descripción del motivo debe ser un texto" })
  @IsNotEmpty({ message: "La descripción del motivo es obligatoria" })
  descripcion: string;

  constructor(partial?: Partial<MotivoNotaDto>) {
    Object.assign(this, partial);
  }
}
