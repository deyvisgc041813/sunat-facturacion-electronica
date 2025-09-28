import { CreateSerieDto } from './dto/CreateSerieDto';
import { SerieResponseDto } from './dto/SerieResponseDto';
import { UpdateSerieDto } from './dto/UpdateSerieDto';

export interface SerieRepository {
  save(
    serie: CreateSerieDto,
  ): Promise<{ status: boolean; message: string; data?: SerieResponseDto }>;
  findAll(sucursalId:number): Promise<SerieResponseDto[]>;
  findById(sucursalId:number, serieId: number): Promise<SerieResponseDto | null>;
  findBySucursalTipCompSerie(
    surcursalId: number,
    tipoComprobante: string,
    serie: string,
  ): Promise<SerieResponseDto | null>;
  update(
    sucursalId:number,
    serie: UpdateSerieDto,
    serieId: number,
  ): Promise<{ status: boolean; message: string; data?: SerieResponseDto }>;
  updateCorrelativoAndLog(
    sucursalId:number,
    serieId: number,
    usuarioId: number,
    newCorrelativo: number,
    motivo: string,
  ): Promise<{ status: boolean; message: string; data?: SerieResponseDto }>;
  actualizarCorrelativo(surcursalId: number, serieId: number, newCorrelativo: number): Promise<void>;
  getNextCorrelativo(
    surcursalId: number,
    tipoComprobante: string,
    serie: string,
  ): Promise<{correlativo:number, serieId:number}>;
}
