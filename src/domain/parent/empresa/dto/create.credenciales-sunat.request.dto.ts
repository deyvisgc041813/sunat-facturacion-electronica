import { Expose, Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';

export class CreateEmpresaCredencialesDto {
  @IsOptional()
  empresaId:number
  @IsEnum(['beta', 'prod'])
  ambiente: string;
  @IsString()
  @Expose({ name: 'client_id' })
  @Transform(({ value }) => String(value))
  @IsNotEmpty({
    message:
      'Cliente id es requerido para consultar valides de comprobantes electronicos',
  })
  @IsOptional()
  clienteId: string;
  @Expose({ name: 'client_secret' })
  @Transform(({ value }) => String(value))
  @IsNotEmpty({
    message:
      'Cliente secret es requerido para consultar valides de comprobantes electronicos',
  })
  @IsOptional()
  clienteSecret: string;
  @Expose({ name: 'usuario_sol_secundario' })
  @Transform(({ value }) => String(value))
  @IsString({ message: 'El usuario SOL secundario debe ser un texto válido' })
  @IsNotEmpty({ message: 'El usuario SOL secundario es obligatorio' })
  @IsString()
  usuarioSolSecundario?: string;

  @Expose({ name: 'clave_sol_secundario' })
  @Transform(({ value }) => String(value))
  @IsString({ message: 'La clave SOL secundaria debe ser un texto válido' })
  @IsNotEmpty({ message: 'La clave del usuario SOL secundario es obligatoria' })
  @IsString()
  claveSolSecundario?: string;

  //@ApiProperty({ type: 'string', format: 'binary', description: 'Archivo del certificado digital en formato .pfx o .pem' })
  @IsOptional()
  certificado_digital: Buffer;

  @Expose({ name: 'clave_certificado' })
  @Transform(({ value }) => String(value))
  //@ApiProperty({ example: 'clave123', description: 'Clave del certificado digital' })
  @IsString({ message: 'La clave del certificado debe ser un texto válido' })
  @IsNotEmpty({ message: 'La clave del certificado digital es obligatoria' })
  claveCertificado?: string;

  @IsOptional()
  @IsString()
  certificadoNombre?: string;

  @IsOptional()
  @IsString()
  certificadoHash?: string;

  @IsOptional()
  @IsString()
  certificadoSubject?: string;

  @IsOptional()
  @IsString()
  certificadoIssuer?: string;

  @IsOptional()
  @IsDateString()
  certificadoValidoDesde?: Date;

  @IsOptional()
  @IsDateString()
  certificadoValidoHasta?: Date;

  @IsOptional()
  @IsString()
  certificadoPublicId?: string;

  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsDateString()
  tokenExpira?: Date;

  @IsOptional()
  @IsEnum(['VIGENTE', 'CADUCADO', 'REVOCADO'])
  estado?: string;
    constructor(partial?: Partial<CreateEmpresaCredencialesDto>) {
    Object.assign(this, partial);
  }
}
