import { AuditoriaLogsResponseDto } from "../dto/auditoria-logs.response.dto";
import { ICreateAuditoriaLog } from "../dto/create.auditoria-logs";

export interface IAuditoriaLogsRepositoryPort {
  save(auditoria: ICreateAuditoriaLog): Promise<void>;
  findBySucursalId(sucursalId:number): Promise<AuditoriaLogsResponseDto[]>;
  findByIdAndSucursalId(logId:number, sucursalId:number): Promise<AuditoriaLogsResponseDto | null>;
  findById(idLog: number): Promise<AuditoriaLogsResponseDto | null> 
  findAll(): Promise<AuditoriaLogsResponseDto[]> 
}
