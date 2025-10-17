import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { buildLogData } from 'src/common/core';
import { APLICACION_ORIGEN } from 'src/util/constantes';
import { EAccionAudit, ETablaAudit } from 'src/util/general.enum';
import { EEstadosGlobales } from 'src/util/estado.enum';
import { AuditoriaService } from '../../core/logs/service/auditoria.logs.service';
import { CreateClienteDto } from '../dto/create.client.dto';
import { ClienteRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/cliente.repository.impl';
import { validarDatosSegunTipoDocumento } from 'src/util/Helpers';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { ClienteResponseDto } from '../dto/client.response.dto';
import { UpdateClienteDto } from '../dto/update.client.dto';

@Injectable()
export class ClienteService {
  constructor(
    private readonly clienteRepo: ClienteRepositoryImpl,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async create(
    cliente: CreateClienteDto,
    auth: IUserPayload,
    origenRegistro: 'MANUAL' | 'AUTOMATICO',
  ): Promise<GenericResponse<ClienteResponseDto>> {
    try {
      if(origenRegistro === "MANUAL") {
        const existe = await this.clienteRepo.findByDocumento(
          cliente.numeroDocumento,
        );
        if (existe ) {
          throw new BadRequestException(
            `El cliente con documento ${cliente.numeroDocumento} ya se encuentra registrado.`,
          );
        }
      }

      validarDatosSegunTipoDocumento(cliente);
      const newCliente = await this.clienteRepo.save(cliente);
      //return
      const logData = buildLogData({
        tablaAfectada: ETablaAudit.CLIENTE,
        accion: EAccionAudit.INSERT,
        valoresNuevos: newCliente.data,
        idRegistro: newCliente.data?.clienteId,
        usuario: auth,
        entorno: '',
        observacion: 'Crear cliente',
        aplicacionOrigen: APLICACION_ORIGEN,
        empresaId: cliente.empresaId ?? 0,
      });
      await this.auditoriaService.saveLog(logData);
      return newCliente;
    } catch (error: any) {
      throw error;
    }
  }

  async getAll(empresaId: number): Promise<ClienteResponseDto[]> {
    return await this.clienteRepo.findAll(empresaId);
  }

  async getById(
    empresaId: number,
    clienteId: number,
  ): Promise<ClienteResponseDto | null> {
    const cliente = await this.clienteRepo.findById(empresaId, clienteId);
    if (!cliente) throw new NotFoundException('Cliente no encontrado.');
    return cliente;
  }
  async getByNumDocumento(numDoc: string): Promise<ClienteResponseDto | null> {
    const cliente = await this.clienteRepo.findByDocumento(numDoc);
    if (!cliente) throw new NotFoundException('Cliente no encontrado.');
    return cliente;
  }

  async update(
    clienteId: number,
    auth: IUserPayload,
    dto: UpdateClienteDto,
  ): Promise<GenericResponse<ClienteResponseDto>> {
    try {
      const empresaId = dto.empresaId ?? 0;
      const exist = await this.clienteRepo.findById(clienteId, empresaId);
      if (!exist) {
        throw new NotFoundException('Cliente no encontrado.');
      }
      const existe = await this.clienteRepo.findByDocumento(dto.numeroDocumento ?? '');
      if (existe && existe.clienteId !== clienteId) {
        throw new BadRequestException(
          `El cliente con documento ${exist.numeroDocumento} ya está registrado para esta empresa`,
        );
      }
      validarDatosSegunTipoDocumento(dto);
      const update = this.clienteRepo.update(dto, clienteId);
      const logData = buildLogData({
        tablaAfectada: ETablaAudit.CLIENTE,
        accion: EAccionAudit.UPDATE,
        valoresAnteriores: JSON.stringify(update),
        valoresNuevos: JSON.stringify(dto),
        usuario: auth,
        entorno: '',
        observacion: 'Actualizar cliente',
        aplicacionOrigen: APLICACION_ORIGEN,
        sucursalId: 0,
        empresaId: dto.empresaId,
      });
      await this.auditoriaService.saveLog(logData);
      return update;
    } catch (error: any) {
      throw error;
    }
  }

  async delete(
    clienteId: number,
    auth: IUserPayload,
  ): Promise<GenericResponse<void>> {
    try {
      const empresaId = auth.empresaId ?? 0;
      const rsp = await this.clienteRepo.updateStatus(
        clienteId,
        empresaId,
        EEstadosGlobales.ELIMINADO,
      );
      const logData = buildLogData({
        tablaAfectada: ETablaAudit.CLIENTE,
        accion: EAccionAudit.DELETE,
        usuario: auth,
        idRegistro: clienteId,
        entorno: '',
        observacion: 'Eliminar cliente',
        aplicacionOrigen: APLICACION_ORIGEN,
        empresaId: empresaId,
      });
      await this.auditoriaService.saveLog(logData);
      rsp.message = 'El cliente se elimino correctamente';
      return rsp;
    } catch (error: any) {
      throw error;
    }
  }
  async activateOrDeactivate(
    clienteId: number,
    nuevoEstado: any,
    auth: IUserPayload,
  ): Promise<GenericResponse<void>> {
    if (
      ![EEstadosGlobales.ACTIVO, EEstadosGlobales.INACTIVO].includes(
        nuevoEstado,
      )
    ) {
      throw new BadRequestException(
        'El estado solo puede ser 1 (activo) o 0 (inactivo)',
      );
    }
    const empresaId = auth.empresaId ?? 0;
    const cliente = await this.clienteRepo.updateStatus(
      clienteId,
      empresaId,
      nuevoEstado,
    );

    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    const accion =
      nuevoEstado === EEstadosGlobales.ACTIVO
        ? 'Cliente activada (estado=1)'
        : 'Cliente desactivada (estado=0)';
    const logData = buildLogData({
      tablaAfectada: ETablaAudit.CLIENTE,
      accion: EAccionAudit.UPDATE,
      idRegistro: clienteId,
      usuario: auth,
      observacion: accion,
      aplicacionOrigen: APLICACION_ORIGEN,
      empresaId: empresaId,
    });
    await this.auditoriaService.saveLog(logData);
    return {
      status: true,
      message: accion,
    };
  }
}
