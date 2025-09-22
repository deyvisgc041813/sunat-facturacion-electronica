import { ClienteResponseDto } from "src/domain/cliente/dto/ClienteResponseDto";
import { UpdateClienteDto } from "src/domain/cliente/dto/UpdateClienteDto";
import { ClienteOrmEntity } from "src/infrastructure/persistence/cliente/ClienteOrmEntity";
import { EmpresaMapper } from "./EmpresaMapper";


export class ClienteMapper {
  static toDomain(orm: ClienteOrmEntity): ClienteResponseDto {
    const empresa = orm.empresa ? EmpresaMapper.toDomain(orm.empresa) : undefined
    return new ClienteResponseDto(
      orm.clienteId,
      orm.tipoDocumento,
      orm.numeroDocumento,
      orm.razonSocial,
      orm.estado,
      orm.direccion,
      orm.correo,
      orm.telefono,
      orm.nombre,
      orm.apellidoPaterno,
      orm.apellidoMaterno,
      orm.estadoComtribuyente,
      orm.condicionDomicilio,
      empresa
    );
  }
  static dtoToOrmUpdate(orm: UpdateClienteDto): ClienteOrmEntity {
     const object = new ClienteOrmEntity()
     object.clienteId = orm.clienteId ?? 0
     object.empresaId = orm.empresaId ?? 0
     object.tipoDocumento = orm.tipoDocumento ?? ""
     object.numeroDocumento = orm.numeroDocumento ?? ""
     object.razonSocial = orm.razonSocial ?? ""
     object.direccion = orm.direccion
     object.correo = orm.correo
     object.telefono = orm.telefono
     object.nombre = orm.nombre,
     object.apellidoPaterno = orm.apellidoPaterno
     object.apellidoMaterno = orm.apellidoMaterno
     object.estadoComtribuyente = orm.estadoComtribuyente
     object.condicionDomicilio = orm.condicionDomicilio
     return object
  }
}

