import { CreateSerieAuditoriaDto } from "../dto/create.serie-auditoria.dto";
import { SerieAuditoriaResponseDto } from "../dto/serie-auditoria.response.dto";
import { UpdateSerieAuditoriaDto } from "../dto/update.serie-auditoria.dto";

export interface SerieAuditoriaRepository {
  save(serie: CreateSerieAuditoriaDto): Promise<{status: boolean, message: string, data?: SerieAuditoriaResponseDto}>;
  findAll(): Promise<SerieAuditoriaResponseDto[]>;
  findById(serieId: number): Promise<SerieAuditoriaResponseDto | null>;
  update(serie: UpdateSerieAuditoriaDto, serieId:number): Promise<{status: boolean, message: string, data?: SerieAuditoriaResponseDto}>
}
