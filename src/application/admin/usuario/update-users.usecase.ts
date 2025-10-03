import { IUserPayload } from "src/adapter/decorator/user.decorator.interface";
import { UpdateUsuarioDto } from "src/domain/auth/dto/usuario/update.request.dto";
import { UsuarioService } from "src/domain/auth/services/usuario.service";


export class UpdateUsersUseCase {
  constructor(private readonly usuarioService: UsuarioService) {}

  async execute(update: UpdateUsuarioDto, userId:number, auth: IUserPayload) {
    return this.usuarioService.update(userId, auth.empresaId ?? 0, auth.sucursalActiva, update, auth.roles);
  }
}