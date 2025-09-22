import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClienteRepository } from 'src/domain/cliente/Cliente.repository';
import { Repository } from 'typeorm';
import { ClienteOrmEntity } from './ClienteOrmEntity';
import { ClienteResponseDto } from 'src/domain/cliente/dto/ClienteResponseDto';
import { CreateClienteDto } from 'src/domain/cliente/dto/CreateRequestDto';
import { UpdateClienteDto } from 'src/domain/cliente/dto/UpdateClienteDto';
import { ClienteMapper } from 'src/domain/mapper/ClienteMapper';

@Injectable()
export class ClienteRepositoryImpl implements ClienteRepository {
  constructor(
    @InjectRepository(ClienteOrmEntity)
    private readonly repo: Repository<ClienteOrmEntity>,
  ) {}
 

  async save(
    cliente: CreateClienteDto
  ): Promise<{ status: boolean; message: string; data?: ClienteResponseDto }> {
    const newCliente = await this.repo.save(cliente);
    return {
      status: true,
      message: 'Cliente registrado correctamente',
      data: ClienteMapper.toDomain(newCliente),
    };
  }

  async findAll(): Promise<ClienteResponseDto[]> {
    const result = await this.repo.find({
      relations: ['empresa'],
    });
    return result.map((c) => ClienteMapper.toDomain(c));
  }

  async findById(id: number): Promise<ClienteResponseDto | null> {
    const cliente = await this.repo.findOne({
      where: { clienteId: id },
      relations: ['empresa'],
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente con id ${id} no encontrado`);
    }
    return ClienteMapper.toDomain(cliente)
  }
  async findByDocumento(empresaId: number, numeroDocumento: string): Promise<ClienteResponseDto | null> {
    const clienteEntity = await this.repo.findOne({where: { empresaId, numeroDocumento }});
    return !clienteEntity ? null : ClienteMapper.toDomain(clienteEntity)
  }
  async update(cliente: UpdateClienteDto, clienteId:number): Promise<{ status: boolean; message: string; data?: ClienteResponseDto }> {
    cliente.clienteId = clienteId
    const clientUpdate = await this.repo.save(ClienteMapper.dtoToOrmUpdate(cliente));
    return {
      status: true,
      message: 'Actualizado correctamente',
      data: ClienteMapper.toDomain(clientUpdate),
    };
  }
}
