import { IsIn, IsNotEmpty, IsString, Length } from 'class-validator';
import { NotaCreditoMotivo, NotaDebitoMotivo } from 'src/util/catalogo.enum';

export class MotivoNotaDto {
  @IsString({ message: 'El código del motivo debe ser un texto' })
  @IsNotEmpty({ message: 'El código del motivo es obligatorio' })
  @Length(2, 2, {
    message: 'El código del motivo debe tener exactamente 2 caracteres',
  })
  @IsIn(
    [...Object.values(NotaCreditoMotivo), ...Object.values(NotaDebitoMotivo)],
    {
      message:
        'El código del motivo no corresponde a un valor válido según SUNAT',
    },
  )
  codigo: any;

  @IsString({ message: 'La descripción del motivo debe ser un texto' })
  @IsNotEmpty({ message: 'La descripción del motivo es obligatoria' })
  descripcion: string;

  constructor(partial?: Partial<MotivoNotaDto>) {
    Object.assign(this, partial);
  }
}
