import { EmpresaMapper } from './EmpresaMapper';
import { SucursalOrmEntity } from 'src/infrastructure/persistence/sucursal/SucursalOrmEntity';
import { SucursalResponseDto } from '../sucursal/dto/SucursalResponseDto';
import { CreateSucursalDto } from '../sucursal/dto/CreateSucursalDto';
import { ProductoMapper } from './ProductoMapper';
import { SerieMapper } from './SerieMapper';
import { ResumenBPMaper } from './ResumenBPMaper';
import { ComunicacionBajaMaper } from './ComunicacionBajaMaper';
import { SunatLogMapper } from './SunatLogMapper';
import { ComprobanteMapper } from './ComprobanteMapper';

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
    return new SucursalResponseDto(
      orm.sucursalId,
      orm.codigo,
      orm.nombre,
      orm.direccion,
      orm.codigoEstablecimientoSunat,
      orm.ubigeo,
      orm.telefono,
      orm.email,
      orm.signatureId,
      orm.signatureNote,
      orm.estado,
      orm.fechaCreacion,
      empresa,
      productos,
      series,
      comprobantes,
      resumenes,
      bajas,
      logs,
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
      orm.codigoEstablecimientoSunat,
      orm.ubigeo,
      orm.telefono,
      orm.email,
      orm.signatureId,
      orm.signatureNote,
      orm.estado,
      orm.fechaCreacion,
      empresa
    );
  }
  static dtoToCreate(orm: CreateSucursalDto): SucursalOrmEntity {
    const object = new SucursalOrmEntity();
    object.codigo = orm.codigo ?? 0;
    object.nombre = orm.nombre ?? 0;
    object.direccion = orm.direccion;
    object.signatureId = orm.signatureId ?? '';
    object.ubigeo = orm.ubigeo ?? '';
    object.telefono = orm.telefono ?? '';
    object.email = orm.email ?? '';
    object.codigoEstablecimientoSunat = orm.codigoEstablecimientoSunat;
    object.signatureNote = orm.signatureNote ?? '';
    return object;
  }
  static dtoToOrmUpdate(orm: any): SucursalOrmEntity {
    const object = new SucursalOrmEntity();
    object.sucursalId = orm.sucursalId;
    object.codigo = orm.codigo ?? 0;
    object.nombre = orm.nombre ?? 0;
    object.direccion = orm.direccion;
    object.signatureId = orm.signatureId ?? '';
    object.ubigeo = orm.ubigeo ?? '';
    object.telefono = orm.telefono ?? '';
    object.email = orm.email ?? '';
    object.signatureNote = orm.signatureNote ?? '';
    return object;
  }
}
