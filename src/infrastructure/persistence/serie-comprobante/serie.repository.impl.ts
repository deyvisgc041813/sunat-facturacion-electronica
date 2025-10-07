import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SerieAuditoriaOrmEntity } from '../serie-log/SerieAuditoriaOrmEntity';
import { CreateSerieAuditoriaDto } from 'src/domain/series-auditoria/dto/CreateSerieAuditoriaDto';
import { SerieMapper } from 'src/domain/mapper/SerieMapper';
import { SerieOrmEntity } from './SerieOrmEntity';
import { ISerieComprobanteRepositoryPort } from 'src/domain/serie-comprobante/ports/serie-comprobante.port';
import { CreateSerieDto } from 'src/domain/serie-comprobante/dto/create.request.dto';
import { SerieResponseDto } from 'src/domain/serie-comprobante/dto/reesponse.dto';
import { UpdateSerieDto } from 'src/domain/serie-comprobante/dto/update.request.dto';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { EEstadosGlobales } from 'src/util/estado.enum';
import { AuditoriaLogsMapper } from 'src/domain/mapper/auditoria-logs.mapper';
import { SerieAuditoriaMapper } from 'src/domain/mapper/SerieAuditoriaMapper';

@Injectable()
export class SerieComprobanteRepositoryImpl
  implements ISerieComprobanteRepositoryPort
{
  constructor(
    @InjectRepository(SerieOrmEntity)
    private readonly repo: Repository<SerieOrmEntity>,
    @InjectRepository(SerieAuditoriaOrmEntity)
    private readonly auditoriaRepo: Repository<SerieAuditoriaOrmEntity>,
  ) {}

  async save(dto: CreateSerieDto): Promise<GenericResponse<SerieResponseDto>> {
    const serieOrm = SerieMapper.dtoToCreate(dto);
    const newSerie = await this.repo.save(serieOrm);
    return {
      status: true,
      message: 'La serie se registró correctamente.',
      data: SerieMapper.toDomain(newSerie),
    };
  }

  async findAll(sucursalId: number): Promise<SerieResponseDto[]> {
    const result = await this.repo.find({
      where: {
        sucursal: { sucursalId },
        estado: In([EEstadosGlobales.ACTIVO, EEstadosGlobales.INACTIVO]),
      },
      relations: ['sucursal'],
    });
    return result.map((s) => SerieMapper.toDomain(s));
  }

  async findById(
    sucursalId: number,
    id: number,
  ): Promise<SerieResponseDto | null> {
    const serie = await this.repo.findOne({
      where: {
        serieId: id,
        sucursal: { sucursalId },
        estado: In([EEstadosGlobales.ACTIVO, EEstadosGlobales.INACTIVO]),
      },
      relations: ['sucursal'],
    });
    if (!serie) {
      throw new NotFoundException(`Serie con id ${id} no encontrado`);
    }
    return SerieMapper.toDomain(serie);
  }
  async update(
    serie: UpdateSerieDto,
    serieId: number,
  ): Promise<GenericResponse<SerieResponseDto>> {
    await this.repo.update(serieId, SerieMapper.dtoToOrmUpdate(serie, serieId));
    return {
      status: true,
      message: 'La serie se actualizó correctamente.',
    };
  }
  async findBySucursalTipCompSerie(
    sucursalId: number,
    tipoComprobante: string,
    serie: string,
  ): Promise<SerieResponseDto | null> {
    const rsp = await this.repo.findOne({
      where: {
        sucursal: { sucursalId },
        tipoComprobante,
        serie,
        estado: EEstadosGlobales.ACTIVO,
      },
    });
    if (!rsp) return null;
    return SerieMapper.toDomain(rsp);
  }

  // async adjustCorrelative(
  //   sucursalId: number,
  //   serieId: number,
  //   usuarioId: number,
  //   newCorrelativo: number,
  //   motivo: string,
  // ): Promise<GenericResponse<SerieResponseDto>> {
  //   try {
  //     const serieOrm = await this.repo.findOne({
  //       where: { serieId, sucursal: { sucursalId } },
  //       relations: ['sucursal'],
  //     });
  //     if (!serieOrm) {
  //       return {
  //         status: false,
  //         message: `No se encontró la serie con ID ${serieId}`,
  //       };
  //     }
  //     serieOrm.correlativoActual = newCorrelativo
  //     serieOrm.serieId = serieId
  //     const updatedSerie = await this.repo.save(serieOrm);
  //     const serieDto = SerieMapper.toDomain(updatedSerie);
  //     const auditoria = new CreateSerieAuditoriaDto();
  //     auditoria.serieId = serieId;
  //     auditoria.usuarioId = usuarioId;
  //     auditoria.correlativoAnterior = serieOrm.correlativoInicial ?? 0;
  //     auditoria.correlativoNuevo = newCorrelativo;
  //     auditoria.motivo = motivo;
  //     serieOrm.correlativoInicial = newCorrelativo;

  //     await this.auditoriaRepo.save(auditoria);

  //     return {
  //       status: true,
  //       message: 'Correlativo actualizado correctamente',
  //       data: serieDto,
  //     };
  //   } catch (error) {
  //     console.error('Error en updateCorrelativoAndLog:', error);
  //     return {
  //       status: false,
  //       message: 'Ocurrió un error al actualizar el correlativo',
  //     };
  //   }
  // }

  async adjustCorrelative(
    sucursalId: number,
    serieId: number,
    usuarioId: number,
    newCorrelativo: number,
    motivo: string,
  ): Promise<GenericResponse<SerieResponseDto>> {
    const queryRunner = this.repo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const serieOrm = await queryRunner.manager.findOne(this.repo.target, {
        where: { serieId, sucursal: { sucursalId } },
        relations: ['sucursal'],
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

      await queryRunner.manager.save(this.repo.target, serieOrm);

      // Crear registro de auditoría
      const auditoria = new CreateSerieAuditoriaDto();
      auditoria.serieId = serieId;
      auditoria.usuarioId = usuarioId;
      auditoria.sucursalId = sucursalId
      auditoria.correlativoAnterior = correlativoAnterior;
      auditoria.correlativoNuevo = newCorrelativo;
      auditoria.motivo = motivo;
      await queryRunner.manager.save(this.auditoriaRepo.target, SerieAuditoriaMapper.dtoToOrmCreate(auditoria));

      // Si todo salió bien
      await queryRunner.commitTransaction();

      const serieDto = SerieMapper.toDomain(serieOrm);
      delete serieDto.sucursal
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
  ): Promise<void> {
    try {
      await this.repo.update(
        { serieId, sucursal: { sucursalId } },
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
  ): Promise<{ correlativo: number; serieId: number }> {
    try {
      const rsp = await this.repo.findOne({
        where: {
          sucursal: { sucursalId },
          tipoComprobante,
          serie,
          estado: EEstadosGlobales.ACTIVO,
        },
      });
      if (!rsp) {
        throw new BadRequestException(`No se encontró la serie con ID ${rsp}`);
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
    const serie = await this.repo.findOne({
      where: { sucursal: { sucursalId }, serieId: serieId },
    });

    if (!serie) {
      throw new NotFoundException(
        `La serie con ID ${serieId} no existe o no pertenece a la sucursal ${sucursalId}.`,
      );
    }
    await this.repo.update(sucursalId, {
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
