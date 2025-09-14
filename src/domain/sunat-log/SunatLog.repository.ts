import { CreateSunatLogDto, SunatLogResponseDto } from "./interface/sunat.log.interface";


export interface SunatLogRepository {
  save(serie: CreateSunatLogDto): Promise<{status: boolean, message: string}>;
  findAll(): Promise<SunatLogResponseDto[]>;
  findById(serieId: number): Promise<SunatLogResponseDto | null>;
}
