import {
  IsString,
  IsNotEmpty,
  Length,
  IsIn,
  IsOptional,
  IsEmail,
  Matches,
} from 'class-validator';

export class CreateEmpresaDto {
  //@ApiProperty({ example: '20123456789', description: 'RUC de la empresa (11 dígitos numéricos)' })
  @IsString({ message: 'El RUC debe ser un texto válido' })
  @IsNotEmpty({ message: 'El RUC es obligatorio' })
  @Length(11, 11, {
    message: 'El RUC debe tener exactamente 11 dígitos numéricos',
  })
  readonly ruc: string;

  //@ApiProperty({ example: 'Mi Empresa SAC', description: 'Razón social de la empresa' })
  @IsString({ message: 'La razón social debe ser un texto válido' })
  @IsNotEmpty({ message: 'La razón social es obligatoria' })
  readonly razonSocial: string;
  @IsOptional()
  @IsString({ message: 'El nombre comercial debe ser un texto válido' })
  readonly nombreComercial: string;
  //@ApiProperty({ type: 'string', format: 'binary', description: 'Archivo del certificado digital en formato .pfx o .pem' })
  @IsOptional()
  certificadoDigital: Buffer;
  @IsOptional()
  logo: Buffer;
  //@ApiProperty({ example: 'Av. Siempre Viva 123', description: 'Dirección fiscal de la empresa' })
  @IsString({ message: 'La dirección debe ser un texto válido' })
  @IsNotEmpty({ message: 'La dirección fiscal es obligatoria' })
  readonly direccion: string;

  //@ApiProperty({ example: 'clave123', description: 'Clave del certificado digital' })
  @IsString({ message: 'La clave del certificado debe ser un texto válido' })
  @IsNotEmpty({ message: 'La clave del certificado digital es obligatoria' })
  claveCertificado: string;

  @IsString({ message: 'El usuario SOL secundario debe ser un texto válido' })
  @IsNotEmpty({ message: 'El usuario SOL secundario es obligatorio' })
  readonly usuarioSolSecundario: string;
  //@ApiProperty({ example: 'USUARIO123', description: 'Usuario SOL secundario' })

  //@ApiProperty({ example: 'clave456', description: 'Clave del usuario SOL secundario' })
  @IsString({ message: 'La clave SOL secundaria debe ser un texto válido' })
  @IsNotEmpty({ message: 'La clave del usuario SOL secundario es obligatoria' })
  claveSolSecundario: string;

  //@ApiProperty({ example: 'BETA', description: 'Modo de operación (BETA o PRODUCCION)', default: 'BETA' })
  @IsString({ message: 'El modo de operación debe ser un texto válido' })
  @IsIn(['BETA', 'PRODUCCION'], {
    message: 'El modo de operación solo puede ser BETA o PRODUCCION',
  })
  readonly modo: string = 'BETA';

  @IsString({ message: 'El correo debe ser un texto válido' })
  @IsNotEmpty({ message: 'El correo de la empresa es obligatorio' })
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  readonly email: string;

  @IsString({ message: 'El teléfono debe ser un texto válido' })
  @IsNotEmpty({ message: 'El teléfono de la empresa es obligatorio' })
  @Length(9, 9, { message: 'El teléfono debe tener exactamente 9 dígitos' })
  @Matches(/^[0-9]+$/, { message: 'El teléfono solo puede contener números' })
  readonly telefono: string;
  @IsOptional()
  logoPublicId:string
  constructor(partial?: Partial<CreateEmpresaDto>) {
    Object.assign(this, partial);
  }
}
