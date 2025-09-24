import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { BajaComprobanteResponseDto } from '../ComunicacionBajaResponseDto';
import { CreateComunicacionBajaDto } from './create.comunicacion.interface';

export interface IComunicacionBajaRepository {
  save(resumen: CreateComunicacionBajaDto): Promise<GenericResponse<number>>;
  findByEmpresaAndId(empresaId:number, id: number): Promise<BajaComprobanteResponseDto | null>;
  getNextCorrelativo(empresaId: number): Promise<number>;
  update(serie: string | number, empresaId: number, data: Partial<CreateComunicacionBajaDto>): Promise<void>;
  updateByEmpresaAndTicket(empresaId: number, ticket: string, data: any): Promise<void>;
  findByEmpresaAndTicket(empresaId: number, ticket: string): Promise<BajaComprobanteResponseDto | null>;
}
