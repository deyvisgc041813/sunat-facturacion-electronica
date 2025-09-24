import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { ResumenResponseDto } from '../dto/ResumenResponseDto';
import { CreateResumenBoletaDto } from './create.summary.interface';

export interface IResumenRepository {
  save(resumen: CreateResumenBoletaDto): Promise<GenericResponse<number>>;
  findByEmpresaAndId(empresaId:number, id: number): Promise<ResumenResponseDto | null>;
  findByFecha(empresaId: number, fecha: string): Promise<ResumenResponseDto[]>;
  getNextCorrelativo(empresaId: number): Promise<number>;
  update(
    resumenId: string | number,
    empresaId: number,
    data: Partial<CreateResumenBoletaDto>,
  ): Promise<void>;
  updateByEmpresaAndTicket(empresaId: number, ticket: string, data: any):Promise<void>
  findByEmpresaAndTicket(empresaId: number, ticket: string): Promise<ResumenResponseDto | null> 
}