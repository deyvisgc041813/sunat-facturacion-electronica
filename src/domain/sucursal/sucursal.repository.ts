import { CreateSucursalDto } from "./dto/CreateSucursalDto";
import { SucursalResponseDto } from "./dto/SucursalResponseDto";


export interface ISucursalRepository {
  save(sucursal: CreateSucursalDto): Promise<{status: boolean, message: string, data?: SucursalResponseDto}>;
  findAll(empresaId:number): Promise<SucursalResponseDto[]>;
  findByIds(sucursalIds:number[], empresaId: number): Promise<SucursalResponseDto[]>;
  findSucursalExterna(empresaId: number, sucursalId: number): Promise<SucursalResponseDto | null>
  findSucursalInterna( empresaId: number,sucursalId: number): Promise<SucursalResponseDto | null>
  update(sucursal: any, sucursalId:number): Promise<{status: boolean, message: string, data?: SucursalResponseDto}> 
}
