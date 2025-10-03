import { GenericResponse } from "src/adapter/web/response/response.interface";
import { RoleRequestDto } from "../dto/usuario/usuario.response.dto";

export interface IRoleRepositoryPort {
  save(usuario: any): Promise<GenericResponse<RoleRequestDto>>;
  findAll(): Promise<RoleRequestDto[]>;
  findById(usuarioId:number): Promise<RoleRequestDto | null>;
  findByUsername(username: string): Promise<RoleRequestDto | null>;
  update(usuario: any): Promise<GenericResponse<RoleRequestDto>>;
    findByIds(roleId:number[]): Promise<RoleRequestDto[]>;
}
