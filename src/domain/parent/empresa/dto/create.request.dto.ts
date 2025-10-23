import { Expose, Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsEmail,
  Matches,
  IsIn,
} from 'class-validator';
import { Plan } from 'src/util/general.enum';
import { CreateEmpresaCredencialesDto } from './create.credenciales-sunat.request.dto';

export class CreateEmpresaDto extends CreateEmpresaCredencialesDto {
  //@ApiProperty({ example: '20123456789', description: 'RUC de la empresa (11 dígitos numéricos)' })
  @IsString({ message: 'El RUC debe ser un texto válido' })
  @IsNotEmpty({ message: 'El RUC es obligatorio' })
  @Length(11, 11, {
    message: 'El RUC debe tener exactamente 11 dígitos numéricos',
  })
  readonly ruc: string;

  //@ApiProperty({ example: 'Mi Empresa SAC', description: 'Razón social de la empresa' })
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

  @IsOptional()
  logo: Buffer;
  @IsOptional()
  logoPublicId:string
  //@ApiProperty({ example: 'Av. Siempre Viva 123', description: 'Dirección fiscal de la empresa' })
  @IsString({ message: 'La dirección debe ser un texto válido' })
  @IsNotEmpty({ message: 'La dirección fiscal es obligatoria' })
  readonly direccion: string;
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
  @Expose({ name: 'codigo_establecimiento' })
  @Transform(({ value }) => String(value))
   @IsString({
    message: 'El codigo de establecimiento de la sucursal debe ser un texto',
  })
  @Length(1, 4, { message: 'El codigo de establecimiento de la sucursal debe tener máximo 4 caracteres'})
  codigoEstablecimiento: string;
  @Expose({ name: 'distrito_id' })
  @Transform(({ value }) => Number(value))
  @IsNotEmpty({ message: 'El campo "distrito_id" es obligatorio.' })
  distritoId: number;
  @Expose({ name: 'sub_dominio' })
  @Transform(({ value }) => String(value))
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'El "sub_dominio" solo puede contener letras minúsculas, números y guiones (sin puntos ni espacios). Ejemplo: "mi-empresa"',
  })
  @IsNotEmpty({ message: 'El campo "sub_dominio" es obligatorio' })
  subDominio: string;
  @Expose({ name: 'generate_sucursal' })
  @Transform(({ value }) => String(value))
  @IsNotEmpty({ message: 'El campo "generate_sucursal" es obligatorio.' })
  generateSucursal: string;
  @Expose({ name: 'activar_sucursal' })
  @Transform(({ value }) => String(value))
  @IsNotEmpty({ message: 'El campo "activar_sucursal" es obligatorio.' })
  activarSucursal: string;
}
