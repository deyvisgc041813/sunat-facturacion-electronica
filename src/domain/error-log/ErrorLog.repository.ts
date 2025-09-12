import { CreateErrorLogDto } from "./dto/CreateErrorLogDto";
import { ErrorLogResponseDto } from "./dto/ErrorLogResponseDto";


export interface ErrorLogRepository {
  save(serie: CreateErrorLogDto): Promise<{status: boolean, message: string, data?: ErrorLogResponseDto}>;
  findAll(): Promise<ErrorLogResponseDto[]>;
  findById(serieId: number): Promise<ErrorLogResponseDto | null>;
}
