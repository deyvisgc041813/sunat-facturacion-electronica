import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In } from 'typeorm';
import { SerieMapper } from 'src/domain/mapper/serie-comprobante.mapper';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { EEstadosGlobales } from 'src/util/estado.enum';
import { SerieAuditoriaMapper } from 'src/domain/mapper/serie-auditoria.mapper';
import { SerieOrmEntity } from '../entity/serie-comprobante/serie-comprobante.orm.entity';
import { SerieAuditoriaOrmEntity } from '../entity/serie-comprobante/serie-auditoria.orm.entity';
import { ISerieComprobanteRepositoryPort } from 'src/domain/tenant/serie-comprobante/ports/serie-comprobante.port';
import { SerieResponseDto } from 'src/domain/tenant/serie-comprobante/dto/reesponse.dto';
import { CreateSerieDto } from 'src/domain/tenant/serie-comprobante/dto/create.request.dto';
import { UpdateSerieDto } from 'src/domain/tenant/serie-comprobante/dto/update.request.dto';
import { CreateSerieAuditoriaDto } from 'src/domain/tenant/series-auditoria/dto/create.serie-auditoria.dto';
import { TenantRepositoryHelper } from 'src/domain/parent/conecciones-database/service/tenant-repository.helper';
import { TenantContextService } from 'src/domain/parent/conecciones-database/service/tenant-context.service';
import { BaseTenantRepository } from '../../base/base-tenant.repository';

@Injectable()
export class SerieComprobanteRepositoryImpl extends BaseTenantRepository<SerieOrmEntity> 
 implements ISerieComprobanteRepositoryPort 
{
  constructor(
    tenantRepositoryHelper: TenantRepositoryHelper,
    tenantContext: TenantContextService
  ) {
      super(tenantContext, tenantRepositoryHelper, SerieOrmEntity);
    }

  async save(dto: CreateSerieDto): Promise<GenericResponse<SerieResponseDto>> {
    const repo = await this.getRepository();
    const serieOrm = SerieMapper.dtoToCreate(dto);
    const newSerie = await repo.save(serieOrm);
    return {
      status: true,
      message: 'La serie se registró correctamente.',
      data: SerieMapper.toDomain(newSerie),
    };
  }

  async findAll(sucursalId: number): Promise<SerieResponseDto[]> {
    const repo = await this.getRepository();
    const result = await repo.find({
      where: {
        sucursalId,
        estado: In([EEstadosGlobales.ACTIVO, EEstadosGlobales.INACTIVO]),
      }
    });
    return result.map((s) => SerieMapper.toDomain(s));
  }

  async findById(
    sucursalId: number,
    serieId: number,
  ): Promise<SerieResponseDto | null> {
    const repo = await this.getRepository();
    const serie = await repo.findOne({
      where: {
        serieId,
        sucursalId,
        estado: EEstadosGlobales.ACTIVO,
      },
    });
    if (!serie) {
      throw new NotFoundException(`Serie con id ${serieId} no encontrado`);
    }
    return SerieMapper.toDomain(serie);
  }
  async update(
    serie: UpdateSerieDto,
    serieId: number,
  ): Promise<GenericResponse<SerieResponseDto>> {
    const repo = await this.getRepository();
    await repo.update(serieId, SerieMapper.dtoToOrmUpdate(serie, serieId));
    return {
      status: true,
      message: 'La serie se actualizó correctamente.',
    };
  }
  async findBySucursalTipCompSerie(
    sucursalId: number,
    tipoComprobante: string,
    serie: string,
    tenantDatabase?:string
  ): Promise<SerieResponseDto | null> {
    const repo = await this.getRepository(tenantDatabase);
    const rsp = await repo.findOne({
      where: {
        sucursalId,
        tipoComprobante,
        serie,
        estado: EEstadosGlobales.ACTIVO,
      },
    });
    if (!rsp) return null;
    return SerieMapper.toDomain(rsp);
  }

  async adjustCorrelative(
    sucursalId: number,
    serieId: number,
    usuarioId: number,
    newCorrelativo: number,
    motivo: string,
  ): Promise<GenericResponse<SerieResponseDto>> {
    const repo = await this.getRepository();
    const queryRunner = repo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const serieOrm = await queryRunner.manager.findOne(repo.target, {
        where: { serieId, sucursalId }
      });

      if (!serieOrm) {
        throw new BadRequestException(
          `No se encontró la serie con ID ${serieId}`,
        );
      }

      // Guardar correlativo anterior antes de modificar
      const correlativoAnterior = serieOrm.correlativoActual ?? 0;

      // Actualizar correlativo actual
      serieOrm.correlativoActual = newCorrelativo;
      serieOrm.fechaModificacion = new Date();

      await queryRunner.manager.save(repo.target, serieOrm);

      // Crear registro de auditoría
      const auditoria = new CreateSerieAuditoriaDto();
      auditoria.serieId = serieId;
      auditoria.usuarioId = usuarioId;
      auditoria.sucursalId = sucursalId
      auditoria.correlativoAnterior = correlativoAnterior;
      auditoria.correlativoNuevo = newCorrelativo;
      auditoria.motivo = motivo;
      const auditoriaRepo = await this.tenantRepositoryHelper.getTenantRepository(this.tenantContext.getSubDominio(), SerieAuditoriaOrmEntity, sucursalId );
      await queryRunner.manager.save(auditoriaRepo.target, SerieAuditoriaMapper.dtoToOrmCreate(auditoria));

      // Si todo salió bien
      await queryRunner.commitTransaction();

      const serieDto = SerieMapper.toDomain(serieOrm);
      return {
        status: true,
        message: 'El correlativo fue ajustado correctamente.',
        data: serieDto,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error
    } finally {
      await queryRunner.release();
    }
  }

  async setNextCorrelativo(
    sucursalId: number,
    serieId: number,
    newCorrelativo: number,
    tenantDatabase?:string
  ): Promise<void> {
    try {
      const repo = await this.getRepository(tenantDatabase);
      await repo.update(
        { serieId, sucursalId},
        { correlativoActual: newCorrelativo, fechaModificacion: new Date() },
      );
    } catch (error) {
      throw error;
    }
  }

  async getNextCorrelativo(
    sucursalId: number,
    tipoComprobante: string,
    serie: string,
    tenantDatabase?:string
  ): Promise<{ correlativo: number; serieId: number }> {
    try {
      const repo = await this.getRepository(tenantDatabase);
      const rsp = await repo.findOne({
        where: {
          sucursalId,
          tipoComprobante,
          serie,
          estado: EEstadosGlobales.ACTIVO,
        },
      });
      if (!rsp) {
        throw new BadRequestException(`No se encontró la serie ${serie}`);
      }
      const newCorrelativo =
        (rsp.correlativoActual ?? rsp.correlativoInicial ?? 0) + 1;
      return { correlativo: newCorrelativo, serieId: rsp.serieId };
    } catch (error) {
      throw error;
    }
  }
  async updateSerieStatus(
    sucursalId: number,
    serieId: number,
    nuevoEstado: string,
    usuarioModificacion: string,
  ): Promise<GenericResponse<void>> {
    const repo = await this.getRepository();
    const serie = await repo.findOne({
      where: { sucursalId, serieId: serieId },
    });

    if (!serie) {
      throw new NotFoundException(
        `La serie con ID ${serieId} no existe o no pertenece a la sucursal ${sucursalId}.`,
      );
    }
    await repo.update(serieId, {
      estado: nuevoEstado,
      usuarioModificacion,
      fechaModificacion: new Date(),
    });
    return {
      status: true,
      message: 'El estado se actualizó correctamente.',
    };
  }
}
