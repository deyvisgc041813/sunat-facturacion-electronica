import { RoleRequestDto } from "src/domain/auth/dto/usuario/usuario.response.dto";

export interface IUserPayload {
  userId: number;           // ID del usuario
  empresaId: number | null; // ID de la empresa (puede ser null)
  roles: RoleRequestDto[];          // Lista de roles del usuario
  sucursales: number[];     // Lista de sucursales asignadas
  correo:string
  nombre:string
  sucursalActiva:number
}