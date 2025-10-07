import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { CreateSucursalDto } from '../dto/create.request.dto';
import { SucursalResponseDto } from '../dto/sucursal.response.dto';
import { UpdateSucursalDto } from '../dto/update.request.dto';

export interface ISucursalRepository {
  save(
    sucursal: CreateSucursalDto,
  ): Promise<GenericResponse<SucursalResponseDto>>;
  getByIdSucursal(
    sucursalesId: number,
    empresaId: number,
  ): Promise<SucursalResponseDto | null>;
  getSucursalesByEmpresa(empresaId: number): Promise<SucursalResponseDto[]>;
  getByIds(
    sucursalIds: number[],
    empresaId: number,
  ): Promise<SucursalResponseDto[]>;
  findSucursalInterna(
    empresaId: number,
    sucursalId: number,
  ): Promise<SucursalResponseDto | null>;
  update(
    sucursalId: number,
    empresaId: number,
    sucursal: UpdateSucursalDto,
  ): Promise<GenericResponse<SucursalResponseDto>>;
  generateBranchCodeByCompany(empresaId: number): Promise<string>;
  updateBranchStatus(
    sucursalId: number,
    nuevoEstado: string,
    usuarioModificacion: string,
  ): Promise<GenericResponse<void>>;
}
