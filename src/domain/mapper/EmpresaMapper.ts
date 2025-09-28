import { CreateEmpresaDto } from 'src/domain/empresa/dto/CreateEmpresaDto';
import { EmpresaOrmEntity } from '../../infrastructure/persistence/empresa/EmpresaOrmEntity';
import { EmpresaResponseDto } from 'src/domain/empresa/dto/EmpresaResponseDto';
import { UpdateEmpresaDto } from 'src/domain/empresa/dto/UpdateEmpresaDto';
import { ClienteMapper } from './ClienteMapper';
import { EmpresaInternaResponseDto } from '../empresa/dto/EmpresaInternaResponseDto';

export class EmpresaMapper {
  static toDomain(orm: EmpresaOrmEntity): EmpresaResponseDto {
    const clientes = orm.clientes
      ? orm.clientes?.map((c) => ClienteMapper.toDomain(c))
      : [];
    return new EmpresaResponseDto(
      orm.empresaId,
      orm.ruc,
      orm.razonSocial,
      orm.logo,
      orm.email,
      orm.telefono,
      orm.nombreComercial ?? '',
      orm.direccion,
      orm.usuarioSolSecundario,
      orm.modo,
      orm.estado,
      clientes
    );
  }
  static toDomainInterno(orm: EmpresaOrmEntity): EmpresaInternaResponseDto {
    const clientes = orm.clientes
      ? orm.clientes?.map((c) => ClienteMapper.toDomain(c))
      : [];
    const base = new EmpresaResponseDto(
      orm.empresaId,
      orm.ruc,
      orm.razonSocial,
      orm.logo ?? "",
      orm.email,
      orm.telefono,
      orm.nombreComercial ?? '',
      orm.direccion,
      orm.usuarioSolSecundario,
      orm.modo, 
      orm.estado,
      clientes
    );
    return new EmpresaInternaResponseDto(
      base,
      orm.claveCertificado,
      orm.claveSolSecundario,
      orm.certificadoDigital
    );
  }
  private static assignCommon(
    object: EmpresaOrmEntity,
    data: any,
    isUpdate = false,
  ): EmpresaOrmEntity {
    object.empresaId = data.empresaId ?? 0;
    object.ruc = data.ruc;
    object.razonSocial = data.razonSocial;
    object.nombreComercial = data.nombreComercial;
    object.direccion = data.direccion;
    object.certificadoDigital = data.certificadoDigital;
    object.claveCertificado = data.claveCertificado;
    object.usuarioSolSecundario = data.usuarioSolSecundario;
    object.modo = data.modo;
    object.claveSolSecundario = data.claveSolSecundario;
    return object;
  }

  static dtoToOrmCreate(dto: CreateEmpresaDto): EmpresaOrmEntity {
    return this.assignCommon(new EmpresaOrmEntity(), dto, false);
  }

  static dtoToOrmUpdate(dto: UpdateEmpresaDto): EmpresaOrmEntity {
    return this.assignCommon(new EmpresaOrmEntity(), dto, true);
  }
}
