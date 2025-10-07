import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditoriaService } from 'src/domain/core/logs/service/auditoria.logs.service';
import { SerieComprobanteRepositoryImpl } from 'src/infrastructure/persistence/serie-comprobante/serie.repository.impl';
import { CreateSerieDto } from '../dto/create.request.dto';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { SerieResponseDto } from '../dto/reesponse.dto';
import { CatalogoRepositoryImpl } from 'src/infrastructure/persistence/catalogo/catalogo.repository.impl';
import { TipoCatalogoEnum } from 'src/util/catalogo.enum';
import { buildLogData } from 'src/common/core';
import { EAccionAudit, ETablaAudit } from 'src/util/general.enum';
import { APLICACION_ORIGEN } from 'src/util/constantes';
import { UpdateSerieDto } from '../dto/update.request.dto';
import { EEstadosGlobales } from 'src/util/estado.enum';

@Injectable()
export class SerieComprobanteService {
  constructor(
    private readonly serieRepo: SerieComprobanteRepositoryImpl,
    private readonly catalogoRepo: CatalogoRepositoryImpl,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async create(
    dto: CreateSerieDto,
    auth: IUserPayload,
  ): Promise<GenericResponse<SerieResponseDto>> {
    try {
      dto.usuarioRegistro = auth.correo;
      dto.correlativoInicial = dto.correlativoInicial ?? 1;
      const existCatalogo = await this.catalogoRepo.obtenerDetallePorCatalogo(
        TipoCatalogoEnum.TIPO_COMPROBANTE,
        dto.tipoComprobante,
      );
      if (!existCatalogo) {
        throw new BadRequestException(
          `El tipo de comprobante ${dto.tipoComprobante} no se encuentra en los catalogos de sunat`,
        );
      }
      const existSerie = await this.serieRepo.findBySucursalTipCompSerie(
        dto.sucursalId,
        dto.tipoComprobante,
        dto.serie,
      );
      if (existSerie) {
        throw new BadRequestException(
          `Ya existe una serie activa (${dto.serie}) registrada para el tipo de comprobante ${dto.tipoComprobante} en esta sucursal.`,
        );
      }
      const rsp = await this.serieRepo.save(dto);
  
      const logData = buildLogData({
        tablaAfectada: ETablaAudit.SERIE_COMPROBANTE,
        accion: EAccionAudit.INSERT,
        idRegistro: rsp.data?.serieId,
        valoresNuevos: dto,
        usuario: auth,
        entorno: '',
        observacion: 'Crear serie comprobante',
        aplicacionOrigen: APLICACION_ORIGEN,
        sucursalId: dto.sucursalId,
      });
      await this.auditoriaService.saveLog(logData);
      return rsp;
    } catch (error: any) {
      throw error;
    }
  }

  async getAll(sucursalId: number): Promise<SerieResponseDto[]> {
    return await this.serieRepo.findAll(sucursalId);
  }

  async getById(
    sucursalId: number,
    serieId: number,
  ): Promise<SerieResponseDto | null> {
    const sucursal = await this.serieRepo.findById(sucursalId, serieId);
    if (!sucursal) throw new NotFoundException('Serie no encontrada.');
    return sucursal;
  }
  async update(
    serieId: number,
    auth: IUserPayload,
    dto: UpdateSerieDto,
  ): Promise<GenericResponse<SerieResponseDto>> {
    try {
      const sucursalId = dto.sucursalId ?? 0;
      const serie = await this.serieRepo.findById(sucursalId, serieId);
      if (!serie) {
        throw new NotFoundException('Serie no encontrada.');
      }
      dto.usuarioModificacion = auth.correo;
      const response = await this.serieRepo.update(dto, serieId);
      const logData = buildLogData({
        tablaAfectada: ETablaAudit.SERIE_COMPROBANTE,
        accion: EAccionAudit.UPDATE,
        valoresAnteriores: JSON.stringify(serie),
        valoresNuevos: JSON.stringify(dto),
        idRegistro: serieId,
        usuario: auth,
        entorno: '',
        observacion: 'Actualizar serie comprobante',
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
    serieId: number,
    auth: IUserPayload,
  ): Promise<GenericResponse<void>> {
    try {
      const rsp = await this.serieRepo.updateSerieStatus(
        auth.sucursalActiva,
        serieId,
        EEstadosGlobales.ELIMINADO,
        auth.correo,
      );
      const logData = buildLogData({
        tablaAfectada: ETablaAudit.SUCURSAL,
        accion: EAccionAudit.DELETE,
        usuario: auth,
        entorno: '',
        observacion: 'Eliminar serie',
        aplicacionOrigen: APLICACION_ORIGEN,
        sucursalId: auth.sucursalActiva,
      });
      await this.auditoriaService.saveLog(logData);
      rsp.message = 'La serie se elimino correctamente';
      return rsp;
    } catch (error: any) {
      throw error;
    }
  }
  async serieStatus(
    serieId: number,
    nuevoEstado: any,
    auth: IUserPayload,
  ): Promise<GenericResponse<void>> {
    console.log(nuevoEstado)
    if ( ![EEstadosGlobales.ACTIVO, EEstadosGlobales.INACTIVO].includes( nuevoEstado)) {
      throw new BadRequestException(
        'El estado solo puede ser 1 (activo) o 0 (inactivo)',
      );
    }

    const serie = await this.serieRepo.updateSerieStatus(
      auth.sucursalActiva,
      serieId,
      nuevoEstado,
      auth.correo,
    );
    if (!serie) throw new NotFoundException('Serie no encontrada');

    const accion =
      nuevoEstado === EEstadosGlobales.ACTIVO
        ? 'Serie activada (estado=1)'
        : 'Serie desactivada (estado=0)';
    const logData = buildLogData({
      tablaAfectada: ETablaAudit.SERIE_COMPROBANTE,
      accion: EAccionAudit.UPDATE,
      usuario: auth,
      observacion: accion,
      aplicacionOrigen: APLICACION_ORIGEN,
      sucursalId: auth.sucursalActiva,
    });
    await this.auditoriaService.saveLog(logData);
    return {
      status: true,
      message: accion,
    };
  }
  async findBySucursalTipCompSerie(
    sucursalId: number,
    tipoComprobante: string,
    serie: string,
  ): Promise<SerieResponseDto> {
    const resp = await this.serieRepo.findBySucursalTipCompSerie(
      sucursalId,
      tipoComprobante,
      serie,
    );

    if (!resp) {
      throw new NotFoundException(
        `No se encontró ninguna serie registrada con los siguientes filtros:   sucursalId=${sucursalId}, tipoComprobante=${tipoComprobante}, serie=${serie}.`,
      );
    }
    return resp;
  }
    async adjustCorrelative(
    sucursalId: number,
    serieId: number,
    usuarioId: number,
    newCorrelativo: number,
    motivo: string,
  ): Promise<GenericResponse<SerieResponseDto>> {
    if (!usuarioId) {
      throw new BadRequestException('El usuarioId es obligatorio');
    }
    if (!newCorrelativo) {
      throw new BadRequestException('El nuevo correlativo es obligatorio');
    }
    if (!motivo) {
      throw new BadRequestException('El motivo es obligatorio');
    }
    return this.serieRepo.adjustCorrelative(sucursalId ?? 0, serieId, usuarioId, newCorrelativo, motivo);
  }
}
