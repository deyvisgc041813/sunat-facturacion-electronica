import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/sucursal/sucursal.repository.impl';
import { CreateSucursalDto } from '../dto/create.request.dto';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { SucursalResponseDto } from '../dto/sucursal.response.dto';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { UpdateSucursalDto } from '../dto/update.request.dto';
import { AuditoriaService } from 'src/domain/core/logs/service/auditoria.logs.service';
import { buildLogData } from 'src/common/core';
import { APLICACION_ORIGEN } from 'src/util/constantes';
import { EAccionAudit, ETablaAudit } from 'src/util/general.enum';
import { EEstadosGlobales } from 'src/util/estado.enum';

@Injectable()
export class SucursalService {
  constructor(
    private readonly sucursalRepo: SucursalRepositoryImpl,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async create(
    dto: CreateSucursalDto,
    auth: IUserPayload,
  ): Promise<GenericResponse<SucursalResponseDto>> {
    try {
      dto.usuarioRegistro = auth.correo;
      const codigo = await this.sucursalRepo.generateBranchCodeByCompany(
        dto.empresaId,
      );
      dto.codigo = codigo;
      const newSucursal = await this.sucursalRepo.save(dto);
      const logData = buildLogData({
        tablaAfectada: ETablaAudit.SUCURSAL,
        accion: EAccionAudit.INSERT,
        valoresNuevos: dto,
        usuario: auth,
        entorno: newSucursal.data?.entorno,
        observacion: 'Crear sucursal',
        aplicacionOrigen: APLICACION_ORIGEN,
        sucursalId: newSucursal.data?.sucursalId,
      });
      await this.auditoriaService.saveLog(logData);
      return newSucursal;
    } catch (error: any) {
      throw error;
    }
  }

  async getAll(empresaId: number): Promise<SucursalResponseDto[]> {
    return await this.sucursalRepo.getSucursalesByEmpresa(empresaId);
  }

  async getById(
    sucursalId: number,
    empresaId: number,
  ): Promise<SucursalResponseDto | undefined> {
    const sucursal = await this.sucursalRepo.getByIdSucursal(
      sucursalId,
      empresaId,
    );
    if (!sucursal) throw new NotFoundException('Sucursal no encontrada.');
    return sucursal;
  }
  async update(
    sucursalId: number,
    auth: IUserPayload,
    dto: UpdateSucursalDto,
  ): Promise<GenericResponse<SucursalResponseDto>> {
    try {
      const empresaId = dto.empresaId ?? 0;
      const sucursal = await this.sucursalRepo.getByIdSucursal(
        sucursalId,
        empresaId,
      );
      if (!sucursal) {
        throw new NotFoundException('Sucursal no encontrada.');
      }
      dto.usuarioModificacion = auth.correo;
      const response = await this.sucursalRepo.update(
        sucursalId,
        empresaId,
        dto,
      );
      const logData = buildLogData({
        tablaAfectada: ETablaAudit.SUCURSAL,
        accion: EAccionAudit.UPDATE,
        valoresAnteriores: JSON.stringify(sucursal),
        valoresNuevos: JSON.stringify(dto),
        usuario: auth,
        entorno: sucursal.entorno,
        observacion: 'Actualizar sucursal',
        aplicacionOrigen: APLICACION_ORIGEN,
        sucursalId: sucursalId,
      });
      await this.auditoriaService.saveLog(logData);
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  async delete(
    sucursalId: number,
    auth: IUserPayload,
  ): Promise<GenericResponse<void>> {
    try {
      const rsp = await this.sucursalRepo.updateBranchStatus(
        sucursalId,
        EEstadosGlobales.ELIMINADO,
        auth.correo,
      );
      const logData = buildLogData({
        tablaAfectada: ETablaAudit.SUCURSAL,
        accion: EAccionAudit.DELETE,
        usuario: auth,
        entorno: '',
        observacion: 'Eliminar sucursal',
        aplicacionOrigen: APLICACION_ORIGEN,
        sucursalId: sucursalId,
      });
      await this.auditoriaService.saveLog(logData);
      rsp.message = "La sucursal se elimino correctamente"
      return rsp;
    } catch (error: any) {
      throw error;
    }
  }
  async branchStatus(
    sucursalId: number,
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

    const sucursal = await this.sucursalRepo.updateBranchStatus(
      sucursalId,
      nuevoEstado,
      auth.correo,
    );

    if (!sucursal) throw new NotFoundException('Sucursal no encontrada');

    const accion =
      nuevoEstado === EEstadosGlobales.ACTIVO
        ? 'Sucursal activada (estado=1)'
        : 'Sucursal desactivada (estado=0)';
    const logData = buildLogData({
      tablaAfectada: ETablaAudit.SUCURSAL,
      accion: EAccionAudit.UPDATE,
      usuario: auth,
      observacion: accion,
      aplicacionOrigen: APLICACION_ORIGEN,
      sucursalId: sucursalId,
    });
    await this.auditoriaService.saveLog(logData);
    return {
      status: true,
      message: accion,
    };
  }
}
