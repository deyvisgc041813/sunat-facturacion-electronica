import { CreateSerieDto } from "./dto/CreateSerieDto";
import { SerieResponseDto } from "./dto/SerieResponseDto";
import { UpdateSerieDto } from "./dto/UpdateSerieDto";

export interface SerieRepository {
  save(serie: CreateSerieDto): Promise<{status: boolean, message: string, data?: SerieResponseDto}>;
  findAll(): Promise<SerieResponseDto[]>;
  findById(serieId: number): Promise<SerieResponseDto | null>;
  findByEmpresaAndTipCompAndSerie(empresaId:number, tipoComprobante: string, serie: string): Promise<SerieResponseDto | null>;
  update(serie: UpdateSerieDto, serieId:number): Promise<{status: boolean, message: string, data?: SerieResponseDto}> 
  actualizarCorrelativo(serieId: number, usuarioId: number, newCorrelativo:number, motivo:string): Promise<{status: boolean, message: string, data?: SerieResponseDto}> 
}