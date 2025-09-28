import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { ResumenResponseDto } from '../dto/ResumenResponseDto';
import { CreateResumenBoletaDto } from './create.summary.interface';

export interface IResumenRepository {
  save(resumen: CreateResumenBoletaDto): Promise<GenericResponse<number>>;
  findById(sucursalId:number, id: number): Promise<ResumenResponseDto | null>;
  findByFecha(sucursalId: number, fecha: string): Promise<ResumenResponseDto[]>;
  getNextCorrelativo(sucursalId: number): Promise<number>;
  update(
    resumenId: string | number,
    sucursalId: number,
    data: Partial<CreateResumenBoletaDto>,
  ): Promise<void>;
  updateBySucursalAndTicket(sucursalId: number, ticket: string, data: any):Promise<void>
  findBySucursalAndTicket(sucursalId: number, ticket: string): Promise<ResumenResponseDto | null> 
}