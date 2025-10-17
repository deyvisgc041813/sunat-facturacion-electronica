import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { ClienteResponseDto } from '../dto/client.response.dto';
import { CreateClienteDto } from '../dto/create.client.dto';

import { UpdateClienteDto } from '../dto/update.client.dto';

export interface IClienteRepositoryPort {
  save(cliente: CreateClienteDto): Promise<GenericResponse<ClienteResponseDto>>;
  findAll(empresaId: number): Promise<ClienteResponseDto[]>;
  findById(
    empresaId: number,
    clienteId: number,
  ): Promise<ClienteResponseDto | null>;
  findByDocumento(
    numeroDocumento: string,
  ): Promise<ClienteResponseDto | null>;
  update(
    cliente: UpdateClienteDto,
    clienteId: number,
  ): Promise<GenericResponse<ClienteResponseDto>>;
  updateStatus(
    clienteId: number,
    empresaId:number,
    nuevoEstado: string
  ): Promise<GenericResponse<void>>;
}
