import {
  BadRequestException,
  ConflictException,
  Injectable
} from '@nestjs/common';
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/sucursal.repository.impl';
import { CreateSucursalDto } from '../dto/create.request.dto';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { SucursalResponseDto } from '../dto/sucursal.response.dto';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { UpdateSucursalDto } from '../dto/update.request.dto';
import { buildLogData } from 'src/common/core';
import { APLICACION_ORIGEN } from 'src/util/constantes';
import { EAccionAudit, ETablaAudit } from 'src/util/general.enum';
import { EEstadosGlobales } from 'src/util/estado.enum';
import { AuditoriaService } from '../../core/logs/service/auditoria.logs.service';
import { TenantDatabaseService } from '../../conecciones-database/service/tenant-database.service';
import { DataSource } from 'typeorm';
import { EmpresaInternaResponseDto } from '../../empresa/dto/internal.response.dto';
import { GetCertificadoDto } from '../../empresa/dto/obtner-certificado.dto';
import { BusinessLogicException } from 'src/adapter/web/exception/exeception-dynamic';

@Injectable()
export class SucursalService {
  constructor(
    private readonly sucursalRepo: SucursalRepositoryImpl,
    private readonly auditoriaService: AuditoriaService,
    private readonly tenantService: TenantDatabaseService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateSucursalDto,
    auth: IUserPayload,
  ): Promise<GenericResponse<SucursalResponseDto>> {
    try {
      dto.usuarioRegistro = auth.correo;
      const subDominioClient = dto.subDominio.trim().toLowerCase();
      if (!subDominioClient.includes('.')) {
        const dominioBase = process.env.DOMINIO_PRINCIPAL;
        dto.subDominio = `${subDominioClient}.${dominioBase}`;
      }
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
    if (!sucursal) throw new BusinessLogicException('Sucursal no encontrada.');
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
        throw new BusinessLogicException('Sucursal no encontrada.');
      }
      if (sucursal.subDominio == dto.subDominio) {
        throw new BusinessLogicException(
          `El sub dominio ${dto?.subDominio} ya se encuentra asignada a la succursal ${sucursal?.nombre}.`,
        );
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
      rsp.message = 'La sucursal se elimino correctamente';
      return rsp;
    } catch (error: any) {
      throw error;
    }
  }
  async deleteById(sucursalId: number, empresaId: number): Promise<void> {
    try {
      const rsp = await this.sucursalRepo.deleteById(sucursalId, empresaId);
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

    if (!sucursal) throw new BusinessLogicException('Sucursal no encontrada');

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
  async activateBranchBilling(
    sucursalId: number,
    auth: IUserPayload,
  ): Promise<GenericResponse<void>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let tenantInvocado = false;
    try {
      const sucursalHabilitada = await this.sucursalRepo.getByIdSucursal(
        sucursalId,
        auth.empresaId ?? 0,
      );
      if (!sucursalHabilitada) {
        // Si la sucursal no fue encontrada, lanzamos una excepción NotFound con un mensaje detallado
        throw new BusinessLogicException(
          `No se encontró la sucursal con el ID ${sucursalId} no esta asociada a la empresaId ${auth.empresaId}. Asegúrese de que el ID de la sucursal sea correcto y que exista en la base de datos.`,
        );
      }
      if (!sucursalHabilitada.subDominio) {
        throw new ConflictException(
          `La sucursal ${sucursalHabilitada?.nombre} aún no está configurada para la emisión de comprobantes electrónicos. 
        Active una sucursal válida mediante el servicio "Establecer sucursal activa para facturación electrónica".`,
        );
      }
      if (sucursalHabilitada.estado == EEstadosGlobales.INACTIVO) {
        // Si la sucursal está deshabilitada, lanzamos un error NotFound con detalles
        throw new BusinessLogicException(
          `La sucursal ${sucursalHabilitada?.nombre} está actualmente deshabilitada. Para habilitarla, contacte con el administrador o revise su configuración.`,
        );
      }

      if (
        sucursalHabilitada.estado == EEstadosGlobales.HABILITADA_FACTURACION
      ) {
        // Si la sucursal ya está habilitada para facturación, lanzamos un error ConflictException con contexto adicional
        throw new ConflictException(
          `La sucursal ${sucursalHabilitada?.nombre}, ya se encuentra habilitada para la emisión de comprobantes electrónicos.`,
        );
      }
      await this.sucursalRepo.updateBranchStatus(
        sucursalId,
        EEstadosGlobales.HABILITADA_FACTURACION,
        auth.correo,
      );
      tenantInvocado = true;
      const numRuc = sucursalHabilitada.empresa?.ruc ?? '';
      const subDominio = sucursalHabilitada.subDominio ?? '';
      await this.tenantService.createTenant(sucursalId, numRuc, subDominio);
      const accion = 'Activar sucursal para facturacion (estado=2)';
      const logData = buildLogData({
        tablaAfectada: ETablaAudit.SUCURSAL,
        accion: EAccionAudit.UPDATE,
        usuario: auth,
        observacion: accion,
        aplicacionOrigen: APLICACION_ORIGEN,
        sucursalId: sucursalId,
      });
      await this.auditoriaService.saveLog(logData);
      await queryRunner.commitTransaction();
      return {
        status: true,
        message: `La sucursal ${sucursalHabilitada?.nombre} fue habilitada correctamente para la emisión de comprobantes electrónicos.`,
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      if (tenantInvocado) {
        await this.sucursalRepo.updateBranchStatus(
          sucursalId,
          EEstadosGlobales.PENDIENTE_ACTIVACION,
          auth.correo,
        );
        console.error(
          'Error durante activación de sucursal, rollback ejecutado:',
          error,
        );
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async getDigitalCertificate(sucursalId: number, empresaId: number) {
    const sucursal = await this.sucursalRepo.findSucursalInterna(
      empresaId,
      sucursalId
    );
    if (!sucursal) {
      throw new BadRequestException(
        `No se encontró ninguna sucursal asociada al identificador proporcionado (${sucursalId}). Verifique que el ID sea correcto.`,
      );
    }
    const empresa = sucursal.empresa as EmpresaInternaResponseDto;
    if (!empresa.certificadoDigital || !empresa?.claveCertificado) {
      throw new BadRequestException(
        `No se encontró certificado digital para la sucursal con RUC ${sucursal.nombre}`,
      );
    }
    const certificado = new GetCertificadoDto(
      empresa.certificadoDigital,
      empresa.claveCertificado ?? '',
      empresa.usuarioSolSecundario ?? '',
      empresa.claveSolSecundario ?? '',
      empresa.email,
      empresa.telefono,
      sucursal.signatureId ?? "",
      sucursal.signatureNote ?? "",
      sucursal.codigoEstablecimiento
    );
    return certificado;
  }
}
