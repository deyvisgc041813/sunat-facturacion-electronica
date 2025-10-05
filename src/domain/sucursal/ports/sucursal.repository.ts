import { GenericResponse } from "src/adapter/web/response/response.interface";
import { CreateSucursalDto } from "../dto/create.request.dto";
import { SucursalResponseDto } from "../dto/sucursal.response.dto";


export interface ISucursalRepository {
  save(sucursal: CreateSucursalDto): Promise<GenericResponse<SucursalResponseDto>>;
  getSucursalesByEmpresa(empresaId:number): Promise<SucursalResponseDto[]>;
  getByIds(sucursalIds:number[], empresaId: number): Promise<SucursalResponseDto[]>;
  findSucursalInterna( empresaId: number,sucursalId: number): Promise<SucursalResponseDto | null>
  update(sucursal: any, sucursalId:number): Promise<GenericResponse<SucursalResponseDto>> 
}
