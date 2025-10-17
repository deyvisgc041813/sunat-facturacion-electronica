import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClienteMapper } from 'src/domain/mapper/cliente.mapper';
import { ClienteOrmEntity } from '../entity/cliente.orm.entity';
import { ClienteResponseDto } from 'src/domain/parent/cliente/dto/client.response.dto';
import { IClienteRepositoryPort } from 'src/domain/parent/cliente/port/client.repository.port';
import { CreateClienteDto } from 'src/domain/parent/cliente/dto/create.client.dto';
import { UpdateClienteDto } from 'src/domain/parent/cliente/dto/update.client.dto';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { EEstadosGlobales } from 'src/util/estado.enum';

@Injectable()
export class ClienteRepositoryImpl implements IClienteRepositoryPort {
  constructor(
    @InjectRepository(ClienteOrmEntity)
    private readonly repo: Repository<ClienteOrmEntity>,
  ) {}

  async save(
    cliente: CreateClienteDto,
  ): Promise<{ status: boolean; message: string; data?: ClienteResponseDto }> {
    const newCliente = await this.repo.save(cliente);
    return {
      status: true,
      message: 'El cliente se registró correctamente.',
      data: ClienteMapper.toDomain(newCliente),
    };
  }

  async findAll(empresaId: number): Promise<ClienteResponseDto[]> {
    const result = await this.repo.find({
      where: { empresaId, estado: In([EEstadosGlobales.ACTIVO, EEstadosGlobales.INACTIVO]) },
      relations: ['empresa'],
    });
    return result.map((c) => ClienteMapper.toDomain(c));
  }

  async findById(
    empresaId: number,
    clienteId: number,
  ): Promise<ClienteResponseDto | null> {
    const cliente = await this.repo.findOne({
      where: { clienteId, empresaId, estado: In([EEstadosGlobales.ACTIVO, EEstadosGlobales.INACTIVO]) },
      relations: ['empresa'],
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente con id ${clienteId} no encontrado`);
    }
    return ClienteMapper.toDomain(cliente);
  }
  async findByDocumento(
    numeroDocumento: string,
  ): Promise<ClienteResponseDto | null> {
    const clienteEntity = await this.repo.findOne({
      where: {numeroDocumento, estado: EEstadosGlobales.ACTIVO },
    });
    return !clienteEntity ? null : ClienteMapper.toDomain(clienteEntity);
  }
  async update(
    cliente: UpdateClienteDto,
    clienteId: number,
  ): Promise<{ status: boolean; message: string; data?: ClienteResponseDto }> {
    cliente.clienteId = clienteId;
    const clientUpdate = await this.repo.save(
      ClienteMapper.dtoToOrmUpdate(cliente),
    );
    return {
      status: true,
      message: 'El cliente se actualizó correctamente.',
      data: ClienteMapper.toDomain(clientUpdate),
    };
  }
  async updateStatus(
    clienteId: number,
    empresaId: number,
    nuevoEstado: string
  ): Promise<GenericResponse<void>> {
    const cliente = await this.repo.findOne({
      where: { clienteId, empresaId },
    });

    if (!cliente) {
      throw new Error(`Cliente con ID ${clienteId} no encontrado`);
    }
    await this.repo.update(clienteId, {
      estado: nuevoEstado,
    });
    return {
      status: true,
      message: 'El estado se actualizó correctamente.',
    };
  }
}
