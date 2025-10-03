import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { CreateUsuarioDto } from '../dto/usuario/create.request.dto';
import { UsuarioResponseDto } from '../dto/usuario/usuario.response.dto';
import { UpdateUsuarioDto } from '../dto/usuario/update.request.dto';

export interface IUsuarioRepositoryPort {
  save(usuario: CreateUsuarioDto): Promise<GenericResponse<UsuarioResponseDto>>;
  findAll(sucursalId: number): Promise<UsuarioResponseDto[]>;
  findById(
    sucursalId: number,
    usuarioId: number,
  ): Promise<UsuarioResponseDto | null>;
  findByUsername(username: string): Promise<UsuarioResponseDto | null>;
  update(
    usuarioId: number,
    usuario: UpdateUsuarioDto,
    hasRoleAndSucursalChanges: boolean,
  ): Promise<GenericResponse<UsuarioResponseDto>>;
  activarSucursal(usuarioId: number, sucursalId:number, fechaSelecion:Date): Promise<boolean>
}
