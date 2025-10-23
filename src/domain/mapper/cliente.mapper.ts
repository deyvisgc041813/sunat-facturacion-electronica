
import { ClienteOrmEntity } from "src/infrastructure/persistence/parent/entity/cliente.orm.entity";
import { ClienteResponseDto } from "../parent/cliente/dto/client.response.dto";
import { EmpresaMapper } from "./empresa.mapper";
import { UpdateClienteDto } from "../parent/cliente/dto/update.client.dto";


export class ClienteMapper {
  static toDomain(orm: ClienteOrmEntity): ClienteResponseDto {
    const empresa = orm.empresa ? EmpresaMapper.toDomain(orm.empresa, true) : undefined
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
     object.estadoComtribuyente = orm.estadoComtribuyente
     object.condicionDomicilio = orm.condicionDomicilio
     return object
  }
}

