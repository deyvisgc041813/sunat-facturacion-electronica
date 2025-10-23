import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { ResumenResponseDto } from '../dto/resumen.response.dto';
import { CreateResumenBoletaDto } from '../interface/create.summary.interface';
import { EstadoEnumComprobante } from 'src/util/estado.enum';

export interface IResumenRepository {
  save(resumen: CreateResumenBoletaDto): Promise<GenericResponse<number>>;
  findById(sucursalId: number, id: number): Promise<ResumenResponseDto | null>;
  findByFecha(
    sucursalId: number,
    fechaResumen: Date,
    estado: EstadoEnumComprobante,
    tenantDatabase?: string,
  ): Promise<ResumenResponseDto[]>;
  getNextCorrelativo(sucursalId: number): Promise<number>;
  update(
    resumenId: string | number,
    sucursalId: number,
    data: Partial<CreateResumenBoletaDto>,
  ): Promise<void>;
  updateBySucursalAndTicket(
    sucursalId: number,
    ticket: string,
    data: any,
  ): Promise<void>;
  findBySucursalAndTicket(
    sucursalId: number,
    ticket: string,
  ): Promise<ResumenResponseDto | null>;
}
