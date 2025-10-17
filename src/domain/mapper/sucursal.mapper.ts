import { EmpresaMapper } from './empresa.mapper';
import { SucursalResponseDto } from '../parent/sucursal/dto/sucursal.response.dto';
import { SucursalOrmEntity } from 'src/infrastructure/persistence/parent/entity/sucursal.orm.entity';
import { CreateSucursalDto } from '../parent/sucursal/dto/create.request.dto';
import { UpdateSucursalDto } from '../parent/sucursal/dto/update.request.dto';
import { DepartamentoResponseDto, DistritoResponseDto, ProvinciaResponseDto, UbigeoResponseDto } from '../parent/ubigeo/dto/ubigeo.response';
import { EmpresaInternaResponseDto } from '../parent/empresa/dto/internal.response.dto';

export class SucursalMapper {
  static toDomain(orm: SucursalOrmEntity): SucursalResponseDto {
    const empresa = orm?.empresa ? EmpresaMapper.toDomain(orm?.empresa) : undefined;
    const productos = [];
    const series = [];
    const comprobantes = [];
    const resumenes = [];
    const bajas = [];
    const logs = [];
    const ubicacionGeografica = orm?.distrito ? SucursalMapper.setUbigeo(orm?.distrito) : undefined  
    return new SucursalResponseDto(
      orm.sucursalId,
      orm.codigo,
      orm.nombre,
      orm.direccion,
      orm.codigoEstablecimiento,
      orm.subDominio,
      orm.entorno,
      orm.ubigeo,
      orm.telefono,
      orm.email,
      orm.signatureId,
      orm.signatureNote,
      orm.estado,
      orm.fechaRegistro,
      orm.usuarioRegistro,
      orm.usuarioModificacion,
      orm.fechaModificacion,
      empresa,
      productos,
      series,
      comprobantes,
      resumenes,
      bajas,
      logs,
      ubicacionGeografica,
    );
  }

  static toDomainInterno(orm: SucursalOrmEntity): SucursalResponseDto {
    const empresa = orm?.empresa
      ? EmpresaMapper.toDomainInterno(orm?.empresa)
      : undefined;
    return new SucursalResponseDto(
      orm.sucursalId,
      orm.codigo,
      orm.nombre,
      orm.direccion,
      orm.codigoEstablecimiento,
      orm.subDominio,
      orm.entorno,
      orm.ubigeo,
      orm.telefono,
      orm.email,
      orm.signatureId,
      orm.signatureNote,
      orm.estado,
      orm.fechaRegistro,
      orm.usuarioRegistro,
      orm.usuarioModificacion,
      orm.fechaModificacion,
      empresa,
    );
  }
  static mapCommonFields(source: any, target: SucursalOrmEntity): void {
    target.codigo = source.codigo ?? 0;
    target.nombre = source.nombre ?? '';
    target.direccion = source.direccion ?? '';
    target.signatureId = source.signatureId ?? '';
    target.ubigeo = source.ubigeo ?? '';
    target.telefono = source.telefono ?? '';
    target.email = source.email ?? '';
    target.signatureNote = source.signatureNote ?? '';
    target.entorno = source.entorno ?? '';
    target.codigoEstablecimiento = source.codigoEstablecimiento ?? '';
    target.subDominio = source.subDominio
    target.distrito = source.distritoId
      ? ({ distritoId: source.distritoId } as any)
      : null;
    target.empresa = source.empresaId
      ? ({ empresaId: source.empresaId } as any)
      : null;
    target.estado = source?.estado  
  }

  static dtoToCreate(dto: CreateSucursalDto): SucursalOrmEntity {
    const entity = new SucursalOrmEntity();
    this.mapCommonFields(dto, entity);
    entity.usuarioRegistro = dto.usuarioRegistro ?? '';
    return entity;
  }

  static dtoToOrmUpdate(dto:UpdateSucursalDto, sucursalId:number): SucursalOrmEntity {
    const entity = new SucursalOrmEntity();
    this.mapCommonFields(dto, entity);
    entity.sucursalId = sucursalId;
    entity.usuarioModificacion = dto.usuarioModificacion;
    entity.fechaModificacion = new Date();
    return entity;
  }
  static setUbigeo(ubicacionGeografica: any): UbigeoResponseDto {

    const distrito = new DistritoResponseDto(
      ubicacionGeografica.distritoId,
      ubicacionGeografica.descripcion,
      ubicacionGeografica.ubigeo,
    );
    const provinciaDto = new ProvinciaResponseDto(
      ubicacionGeografica?.provincia?.provinciaId,
      ubicacionGeografica?.provincia?.descripcion,
      ubicacionGeografica?.provincia?.ubigeo,
      distrito,
    );
    const departamentoDto = new DepartamentoResponseDto(
      ubicacionGeografica?.provincia?.departamento?.departamentoId,
      ubicacionGeografica?.provincia?.departamento?.descripcion,
      ubicacionGeografica?.provincia?.departamento?.ubigeo,
      provinciaDto
    );
    const ubigeoResponse = new UbigeoResponseDto(departamentoDto);
    return ubigeoResponse;
  }
}
