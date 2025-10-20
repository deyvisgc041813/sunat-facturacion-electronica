import { Expose, Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsEmail,
  Matches,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { Plan } from 'src/util/general.enum';

export class CreateEmpresaOnboardingDto {
  @IsString({ message: 'El RUC debe ser un texto válido' })
  @IsNotEmpty({ message: 'El RUC es obligatorio' })
  @Length(11, 11, {
    message: 'El RUC debe tener exactamente 11 dígitos numéricos',
  })
  readonly ruc: string;

  @Expose({ name: 'razon_social' })
  @Transform(({ value }) => String(value))
  @IsString({ message: 'La razón social debe ser un texto válido' })
  @IsNotEmpty({ message: 'La razón social es obligatoria' })
  readonly razonSocial: string;

  @Expose({ name: 'nombre_comercial' })
  @Transform(({ value }) => String(value))
  @IsOptional()
  @IsString({ message: 'El nombre comercial debe ser un texto válido' })
  readonly nombreComercial: string;
  //@ApiProperty({ type: 'string', format: 'binary', description: 'Archivo del certificado digital en formato .pfx o .pem' })
  @IsOptional()
  certificado_digital: Buffer;

  @IsOptional()
  logo: Buffer;
  //@ApiProperty({ example: 'Av. Siempre Viva 123', description: 'Dirección fiscal de la empresa' })
  @IsString({ message: 'La dirección debe ser un texto válido' })
  @IsNotEmpty({ message: 'La dirección fiscal es obligatoria' })
  readonly direccion: string;

  @Expose({ name: 'clave_certificado' })
  @Transform(({ value }) => String(value))
  //@ApiProperty({ example: 'clave123', description: 'Clave del certificado digital' })
  @IsString({ message: 'La clave del certificado debe ser un texto válido' })
  @IsNotEmpty({ message: 'La clave del certificado digital es obligatoria' })
  claveCertificado: string;

  @Expose({ name: 'usuario_sol_secundario' })
  @Transform(({ value }) => String(value))
  @IsString({ message: 'El usuario SOL secundario debe ser un texto válido' })
  @IsNotEmpty({ message: 'El usuario SOL secundario es obligatorio' })
  readonly usuarioSolSecundario: string;

  @Expose({ name: 'clave_sol_secundario' })
  @Transform(({ value }) => String(value))
  @IsString({ message: 'La clave SOL secundaria debe ser un texto válido' })
  @IsNotEmpty({ message: 'La clave del usuario SOL secundario es obligatoria' })
  claveSolSecundario: string;
  @IsNotEmpty({
    message: 'El codigo de establecimiento de la sucursal es obligatorio',
  })
  @Expose({ name: 'codigo_establecimiento' })
  @Transform(({ value }) => String(value))
   @IsString({
    message: 'El codigo de establecimiento de la sucursal debe ser un texto',
  })
  @Length(1, 4, { message: 'El codigo de establecimiento de la sucursal debe tener máximo 4 caracteres'})
  codigoEstablecimiento: string;

  @IsString({ message: 'El correo debe ser un texto válido' })
  @IsNotEmpty({ message: 'El correo de la empresa es obligatorio' })
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  readonly email: string;

  @IsString({ message: 'El teléfono debe ser un texto válido' })
  @IsNotEmpty({ message: 'El teléfono de la empresa es obligatorio' })
  @Length(9, 9, { message: 'El teléfono debe tener exactamente 9 dígitos' })
  @Matches(/^[0-9]+$/, { message: 'El teléfono solo puede contener números' })
  readonly telefono: string;
  @IsString({ message: 'El plan debe ser un texto válido.' })
  @IsNotEmpty({ message: 'El plan es obligatorio.' })
  @IsIn([Plan.Basico, Plan.Estándar, Plan.Profesional, Plan.Empresarial], {
    message:
      'El plan debe ser uno de los siguientes: Plan Básico (01), Plan Estándar (02), Plan Profesional (03) o Plan Empresarial (04).',
  })
  plan: string;

  @Expose({ name: 'client_secret' })
  @Transform(({ value }) => String(value))
  @IsOptional()
  clienteSecret: string;
  @Expose({ name: 'client_id' })
  @Transform(({ value }) => String(value))
  @IsOptional()
  clienteId: string;
  @Expose({ name: 'distrito_id' })
  @Transform(({ value }) => Number(value))
  @IsNotEmpty({ message: 'El campo "distrito_id" es obligatorio.' })
  distritoId:number
  @Expose({ name: 'sub_dominio' })
  @Transform(({ value }) => String(value))
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'El "sub_dominio" solo puede contener letras minúsculas, números y guiones (sin puntos ni espacios). Ejemplo: "mi-empresa"',
  })
  @IsNotEmpty({ message: 'El campo "sub_dominio" es obligatorio' })
  subDominio:string
  
  @IsNotEmpty({ message: 'El campo entorno es obligatorio' })
  @IsString({ message: 'El campo entorno debe ser un texto válido' })
  @IsIn(['BETA', 'PRODUCCION'], {
    message: 'El entorno solo puede ser BETA o PRODUCCION',
  })
  readonly entorno: string = 'BETA';
  @Expose({ name: 'generate_sucursal' })
  @Transform(({ value }) => String(value))
  @IsNotEmpty({ message: 'El campo "generate_sucursal" es obligatorio.' })
  generateSucursal: string;
  @Expose({ name: 'activar_sucursal' })
  @Transform(({ value }) => String(value))
  @IsNotEmpty({ message: 'El campo "activar_sucursal" es obligatorio.' })
  activarSucursal: string;
  @IsOptional()
  logoPublicId: string;
  @IsOptional()
  certificadoNombreArchivo: string;
  @IsOptional()
  certificadoHash: string;
  @IsOptional()
  certificadoSubject: string;
  @IsOptional()
  certificadoIssuer: string;
  @IsOptional()
  certificadoValidoDesde: string;
  @IsOptional()
  certificadoValidoHasta: string;
  @IsOptional()
  certificadoPublicId: string;

  constructor(partial?: Partial<CreateEmpresaOnboardingDto>) {
    Object.assign(this, partial);
  }
}
