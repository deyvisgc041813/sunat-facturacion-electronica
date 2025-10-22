import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { CreateComunicacionBajaDto } from './create.comunicacion.interface';
import { BajaComprobanteResponseDto } from '../dto/ComunicacionBajaResponseDto';
import { EstadoEnumComprobante } from 'src/util/estado.enum';

export interface IComunicacionBajaRepository {
  save(resumen: CreateComunicacionBajaDto): Promise<GenericResponse<number>>;
  findBySucursalAndId(
    sucursalId: number,
    id: number,
  ): Promise<BajaComprobanteResponseDto | null>;
  getNextCorrelativo(sucursalId: number): Promise<number>;
  update(
    serie: string | number,
    sucursalId: number,
    data: Partial<CreateComunicacionBajaDto>,
  ): Promise<void>;
  updateBySucursalAndTicket(
    sucursalId: number,
    ticket: string,
    data: any,
  ): Promise<void>;
  findBySucursalAndTicket(
    sucursalId: number,
    ticket: string,
  ): Promise<BajaComprobanteResponseDto | null>;
 findByFecha(
    sucursalId: number,
    fechaResumen: Date,
    estado: EstadoEnumComprobante,
    tenantDatabase?: string,
  ): Promise<BajaComprobanteResponseDto[]>;
}
