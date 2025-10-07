import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { CreateSerieDto } from '../dto/create.request.dto';
import { SerieResponseDto } from '../dto/reesponse.dto';
import { UpdateSerieDto } from '../dto/update.request.dto';

export interface ISerieComprobanteRepositoryPort {
  save(serie: CreateSerieDto): Promise<GenericResponse<SerieResponseDto>>;
  findAll(sucursalId: number): Promise<SerieResponseDto[]>;
  findById(
    sucursalId: number,
    serieId: number,
  ): Promise<SerieResponseDto | null>;
  findBySucursalTipCompSerie(
    surcursalId: number,
    tipoComprobante: string,
    serie: string,
  ): Promise<SerieResponseDto | null>;
  update(
    serie: UpdateSerieDto,
    serieId: number,
  ): Promise<GenericResponse<SerieResponseDto>>;
  adjustCorrelative(
    sucursalId: number,
    serieId: number,
    usuarioId: number,
    newCorrelativo: number,
    motivo: string,
  ): Promise<GenericResponse<SerieResponseDto>>;
  setNextCorrelativo(
    surcursalId: number,
    serieId: number,
    newCorrelativo: number,
  ): Promise<void>;
  getNextCorrelativo(
    surcursalId: number,
    tipoComprobante: string,
    serie: string,
  ): Promise<{ correlativo: number; serieId: number }>;
  updateSerieStatus(
    sucursalId: number,
    serieId: number,
    nuevoEstado: string,
    usuarioModificacion: string,
  ): Promise<GenericResponse<void>>;
}
