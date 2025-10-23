

import { ClienteMapper } from './cliente.mapper';
import { SucursalMapper } from './sucursal.mapper';
import { EmpresaResponseDto } from '../parent/empresa/dto/external.response.dto';
import { SucursalOrmEntity } from 'src/infrastructure/persistence/parent/entity/sucursal.orm.entity';
import { CreateEmpresaDto } from '../parent/empresa/dto/create.request.dto';
import { UpdateEmpresaDto } from '../parent/empresa/dto/update.request';
import { EmpresaOrmEntity } from 'src/infrastructure/persistence/parent/entity/empresa/empesa.orm.entity';
import { EmpresaCredencialesMapper } from './empresa-credenciales-sunat.mapper';
import { EmpresaCredencialesInternaResponseDto, EmpresaCredencialesResponseDto } from '../parent/empresa/dto/credenciales-sunat.response.dto';

export class EmpresaMapper {
  static toDomain(orm: EmpresaOrmEntity, externo:boolean): EmpresaResponseDto {
    const clientes = orm.clientes
      ? orm.clientes?.map((c) => ClienteMapper.toDomain(c))
      : [];
    const sucursales = orm.sucursales
      ? orm.sucursales.map(({ empresa, ...rest }) =>
          SucursalMapper.toDomain(rest as SucursalOrmEntity),
        )
      : [];
    let credenciales:EmpresaCredencialesResponseDto[] | EmpresaCredencialesInternaResponseDto[]   = []
    if(externo) credenciales = orm.credenciales ?  orm.credenciales.map(rsp => EmpresaCredencialesMapper.toDomain(rsp)) : [];
    else credenciales = orm.credenciales ?  orm.credenciales.map(rsp => EmpresaCredencialesMapper.toDomainInterno(rsp)) : [];
    return new EmpresaResponseDto(
      orm.empresaId,
      orm.ruc,
      orm.razonSocial,
      orm.logo,
      orm.email,
      orm.telefono,
      orm.fechaRegistro,
      orm.plan,
      credenciales,
      orm.nombreComercial ?? '',
      orm.direccion,
      clientes,
      sucursales
    );
  }
  private static assignCommon(
    object: EmpresaOrmEntity,
    data: any,
  ): EmpresaOrmEntity {
    object.ruc = data?.ruc;
    object.razonSocial = data?.razonSocial;
    object.nombreComercial = data?.nombreComercial;
    object.direccion = data?.direccion;
    object.email = data?.email;
    object.telefono = data?.telefono;
    object.logo = data?.logo;
    object.logoPublicId = data?.logoPublicId;
    object.plan = data?.plan
    return object;
  }

  static dtoToOrmCreate(dto: CreateEmpresaDto): EmpresaOrmEntity {
    return this.assignCommon(new EmpresaOrmEntity(), dto);
  }

  static dtoToOrmUpdate(dto: UpdateEmpresaDto): EmpresaOrmEntity {
    return this.assignCommon(new EmpresaOrmEntity(), dto);
  }
}
