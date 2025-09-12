
import {
  IsString,
  IsNotEmpty,
  Length,
  IsNumber,
  IsIn,
  IsOptional,
} from 'class-validator';

export class CreateEmpresaDto {
  //@ApiProperty({ example: '20123456789', description: 'RUC de la empresa (11 dígitos numéricos)' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11, { message: 'El RUC debe tener exactamente 11 dígitos' })
  readonly ruc: string;

  //@ApiProperty({ example: 'Mi Empresa SAC', description: 'Razón social de la empresa' })
  @IsString()
  @IsNotEmpty({ message: 'La razón social es obligatoria' })
  readonly razonSocial: string;
  @IsString()
  @IsNotEmpty({ message: 'El nombre comercial es obligatoria' })
  readonly nombreComercial: string;

  //@ApiProperty({ type: 'string', format: 'binary', description: 'Archivo del certificado digital en formato .pfx o .pem' })
  @IsOptional()
  certificadoDigital: Buffer;

  //@ApiProperty({ example: 'Av. Siempre Viva 123', description: 'Dirección fiscal de la empresa' })
  @IsString()
  @IsNotEmpty()
  readonly direccion: string;

  //@ApiProperty({ example: 'clave123', description: 'Clave del certificado digital' })
  @IsString()
  @IsNotEmpty({ message: 'La clave del certificado es obligatoria' })
  claveCertificado: string;

  //@ApiProperty({ example: 'USUARIO123', description: 'Usuario SOL secundario' })
  @IsString()
  @IsNotEmpty({ message: 'El usuario SOL secundario es obligatorio' })
  readonly usuarioSolSecundario: string;

  //@ApiProperty({ example: 'clave456', description: 'Clave del usuario SOL secundario' })
  @IsString()
  @IsNotEmpty({ message: 'La clave del usuario SOL secundario es obligatoria' })
  claveSolSecundario: string;

  //@ApiProperty({ example: 'BETA', description: 'Modo de operación (BETA o PRODUCCION)', default: 'BETA' })
  @IsString()
  @IsIn(['BETA', 'PRODUCCION'], { message: 'El modo debe ser BETA o PRODUCCION' })
  readonly modo: string = 'BETA';

//@ApiProperty({ example: 1, description: 'Estado de la empresa (1 = Activo, 0 = Inactivo)', default: 1 })
  @IsNumber()
  @IsOptional()
  readonly estado: number = 1;

constructor(partial?: Partial<CreateEmpresaDto>) {
    Object.assign(this, partial);
  }
}
