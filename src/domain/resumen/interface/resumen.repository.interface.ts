import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { ResumenResponseDto } from '../dto/ResumenResponseDto';
import { CreateResumenBoletaDto } from './create.summary.interface';

export interface IResumenRepository {
  save(resumen: CreateResumenBoletaDto): Promise<GenericResponse<number>>;
  findById(id: number): Promise<ResumenResponseDto | null>;
  findByFecha(empresaId: number, fecha: string): Promise<ResumenResponseDto[]>;
  getNextCorrelativo(empresaId: number): Promise<number>;
  update(
    resumenId: string | number,
    data: Partial<CreateResumenBoletaDto>,
  ): Promise<void>;
  updateByTicket(ticket: string, data: any):Promise<void>
 findByTicket(ticket: string): Promise<ResumenResponseDto | null> 
}


