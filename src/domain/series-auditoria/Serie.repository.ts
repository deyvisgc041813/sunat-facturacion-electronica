import { CreateSerieAuditoriaDto } from "./dto/CreateSerieAuditoriaDto";
import { SerieAuditoriaResponseDto } from "./dto/SerieAuditoriaResponseDto";
import { UpdateSerieAuditoriaDto } from "./dto/UpdateSerieAuditoriaDto";

export interface SerieAuditoriaRepository {
  save(serie: CreateSerieAuditoriaDto): Promise<{status: boolean, message: string, data?: SerieAuditoriaResponseDto}>;
  findAll(): Promise<SerieAuditoriaResponseDto[]>;
  findById(serieId: number): Promise<SerieAuditoriaResponseDto | null>;
  update(serie: UpdateSerieAuditoriaDto, serieId:number): Promise<{status: boolean, message: string, data?: SerieAuditoriaResponseDto}>
}
