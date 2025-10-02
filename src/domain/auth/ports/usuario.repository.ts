import { CreateUsuarioDto } from "../dto/usuario/create.request.dto";
import { UsuarioResponseDto } from "../dto/usuario/usuario.response.dto";

export interface IUsuarioRepositoryPort {
  save(usuario: CreateUsuarioDto): Promise<{status: boolean, message: string, data?: UsuarioResponseDto}>;
  findAll(): Promise<UsuarioResponseDto[]>;
  findById(usuarioId:number): Promise<UsuarioResponseDto | null>;
  findByUsername(username: string): Promise<UsuarioResponseDto | null>;
}
