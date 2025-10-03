import { CreateUsuarioDto } from "src/domain/auth/dto/usuario/create.request.dto";
import { UsuarioService } from "src/domain/auth/services/usuario.service";


export class CreateUsersUseCase {
  constructor(private readonly usuarioService: UsuarioService) {}

  async execute(create: CreateUsuarioDto, empresaId:number) {
    return this.usuarioService.create(create, empresaId);
  }
}