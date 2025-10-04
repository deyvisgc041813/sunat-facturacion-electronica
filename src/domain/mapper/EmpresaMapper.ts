import { CreateEmpresaDto } from 'src/domain/empresa/dto/CreateEmpresaDto';
import { EmpresaOrmEntity } from '../../infrastructure/persistence/empresa/EmpresaOrmEntity';
import { EmpresaResponseDto } from 'src/domain/empresa/dto/EmpresaResponseDto';
import { UpdateEmpresaDto } from 'src/domain/empresa/dto/UpdateEmpresaDto';
import { ClienteMapper } from './ClienteMapper';
import { EmpresaInternaResponseDto } from '../empresa/dto/EmpresaInternaResponseDto';
import { SucursalMapper } from './SucursalMapper';
import { SucursalOrmEntity } from 'src/infrastructure/persistence/sucursal/SucursalOrmEntity';

export class EmpresaMapper {
  static toDomain(orm: EmpresaOrmEntity): EmpresaResponseDto {
    const clientes = orm.clientes
      ? orm.clientes?.map((c) => ClienteMapper.toDomain(c))
      : [];
    const sucursales = orm.sucursales
      ? orm.sucursales.map(({ empresa, ...rest }) =>
          SucursalMapper.toDomain(rest as SucursalOrmEntity),
        )
      : [];
    return new EmpresaResponseDto(
      orm.empresaId,
      orm.ruc,
      orm.razonSocial,
      orm.logo,
      orm.email,
      orm.telefono,
      orm.fechaRegistro,
      orm.certificadoNombreArchivo,
      orm.certificadoHash,
      orm.certificadoSubject,
      orm.certificadoIssuer,
      orm.certificadoValidoDesde,
      orm.certificadoValidoHasta,
      orm.nombreComercial ?? '',
      orm.direccion,
      orm.usuarioSolSecundario,
      orm.modo,
      orm.estado,
      orm.logoPublicId,
      orm.certificadoPublicId,
      clientes,
      sucursales,
    );
  }
  static toDomainInterno(orm: EmpresaOrmEntity): EmpresaInternaResponseDto {
    const clientes = orm.clientes
      ? orm.clientes?.map((c) => ClienteMapper.toDomain(c))
      : [];
    const sucursales = orm.sucursales
      ? orm.sucursales.map(({ empresa, ...rest }) =>
          SucursalMapper.toDomain(rest as SucursalOrmEntity),
        )
      : [];
    const base = new EmpresaResponseDto(
      orm.empresaId,
      orm.ruc,
      orm.razonSocial,
      orm.logo ?? '',
      orm.email,
      orm.telefono,
      orm.fechaRegistro,
      orm.certificadoNombreArchivo,
      orm.certificadoHash,
      orm.certificadoSubject,
      orm.certificadoIssuer,
      orm.certificadoValidoDesde,
      orm.certificadoValidoHasta,
      orm.nombreComercial ?? '',
      orm.direccion,
      orm.usuarioSolSecundario,
      orm.modo,
      orm.estado,
      orm.logoPublicId,
      orm.certificadoPublicId,
      clientes,

      sucursales,
    );
    return new EmpresaInternaResponseDto(
      base,
      orm.claveCertificado,
      orm.claveSolSecundario,
      orm.certificadoDigital,
    );
  }
  private static assignCommon(
    object: EmpresaOrmEntity,
    data: any,
    isUpdate = false,
  ): EmpresaOrmEntity {
    object.ruc = data?.ruc;
    object.razonSocial = data?.razonSocial;
    object.nombreComercial = data?.nombreComercial;
    object.direccion = data?.direccion;
    object.certificadoDigital = data?.certificadoDigital;
    object.claveCertificado = data?.claveCertificado;
    object.usuarioSolSecundario = data?.usuarioSolSecundario;
    object.modo = data?.modo;
    object.claveSolSecundario = data?.claveSolSecundario;
    object.email = data?.email;
    object.telefono = data?.telefono;
    object.logo = data?.logo;
    object.logoPublicId = data?.logoPublicId;
    object.certificadoNombreArchivo = data?.certificadoNombreArchivo
    object.certificadoHash = data?.certificadoHash
    object.certificadoSubject = data?.certificadoSubject
    object.certificadoIssuer = data?.certificadoIssuer
    object.certificadoValidoDesde = data?.certificadoValidoDesde
    object.certificadoValidoHasta = data?.certificadoValidoHasta
    return object;
  }

  static dtoToOrmCreate(dto: CreateEmpresaDto): EmpresaOrmEntity {
    return this.assignCommon(new EmpresaOrmEntity(), dto, false);
  }

  static dtoToOrmUpdate(dto: UpdateEmpresaDto): EmpresaOrmEntity {
    return this.assignCommon(new EmpresaOrmEntity(), dto, true);
  }
}
