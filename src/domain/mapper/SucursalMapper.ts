import { EmpresaMapper } from './EmpresaMapper';
import { SucursalOrmEntity } from 'src/infrastructure/persistence/sucursal/SucursalOrmEntity';
import { SucursalResponseDto } from '../sucursal/dto/sucursal.response.dto';
import { CreateSucursalDto } from '../sucursal/dto/create.request.dto';
import { ProductoMapper } from './ProductoMapper';
import { SerieMapper } from './SerieMapper';
import { ResumenBPMaper } from './ResumenBPMaper';
import { ComunicacionBajaMaper } from './ComunicacionBajaMaper';
import { SunatLogMapper } from './SunatLogMapper';
import { ComprobanteMapper } from './ComprobanteMapper';
import {
  DepartamentoResponseDto,
  DistritoResponseDto,
  ProvinciaResponseDto,
  UbigeoResponseDto,
} from '../ubigeo/dto/ubigeo.response';
import { UpdateSucursalDto } from '../sucursal/dto/update.request.dto';

export class SucursalMapper {
  static toDomain(orm: SucursalOrmEntity): SucursalResponseDto {
    const empresa = orm.empresa
      ? EmpresaMapper.toDomain(orm.empresa)
      : undefined;
    const productos = orm.productos
      ? orm.productos?.map((p) => ProductoMapper.ormToDTO(p))
      : [];
    const series = orm.series
      ? orm.series?.map((s) => SerieMapper.toDomain(s))
      : [];
    const comprobantes = orm.comprobantes
      ? orm.comprobantes?.map((c) => ComprobanteMapper.toDomain(c))
      : [];
    const resumenes = orm.resumenes
      ? orm.resumenes?.map((r) => ResumenBPMaper.toDomain(r))
      : [];
    const bajas = orm.comunicacionBaja
      ? orm.comunicacionBaja?.map((c) => ComunicacionBajaMaper.toDomain(c))
      : [];
    const logs = orm.sunatLog
      ? orm.sunatLog?.map((l) => SunatLogMapper.toDomain(l))
      : [];
    const ubicacionGeografica = orm?.distrito ? SucursalMapper.setUbigeo(orm?.distrito) : undefined  
    return new SucursalResponseDto(
      orm.sucursalId,
      orm.codigo,
      orm.nombre,
      orm.direccion,
      orm.codigoEstablecimiento,
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
    const empresa = orm.empresa
      ? EmpresaMapper.toDomainInterno(orm.empresa)
      : undefined;
    return new SucursalResponseDto(
      orm.sucursalId,
      orm.codigo,
      orm.nombre,
      orm.direccion,
      orm.codigoEstablecimiento,
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
    target.distrito = source.distritoId
      ? ({ distritoId: source.distritoId } as any)
      : null;
    target.empresa = source.empresaId
      ? ({ empresaId: source.empresaId } as any)
      : null;
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
