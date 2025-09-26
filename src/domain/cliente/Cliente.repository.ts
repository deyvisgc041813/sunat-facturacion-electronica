
import { ClienteResponseDto } from "./dto/ClienteResponseDto";
import { CreateClienteDto } from "./dto/CreateRequestDto";

import { UpdateClienteDto } from "./dto/UpdateClienteDto";

export interface ClienteRepository {
  save(cliente: CreateClienteDto): Promise<{status: boolean, message: string, data?: ClienteResponseDto}>;
  findAll(): Promise<ClienteResponseDto[]>;
  findById(empresaId:number, clienteId: number): Promise<ClienteResponseDto | null>;
  findByDocumento(empresaId: number, numeroDocumento: string): Promise<ClienteResponseDto | null>;
  update(cliente: UpdateClienteDto, clienteId:number): Promise<{status: boolean, message: string, data?: ClienteResponseDto}>

}
