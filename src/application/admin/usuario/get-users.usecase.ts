import { UsuarioService } from "src/domain/auth/services/usuario.service";


export class GetUsersUseCase {
  constructor(private readonly usuarioService: UsuarioService) {}

  async execute(sucursalId:number) {
    return this.usuarioService.findAll(sucursalId);
  }
}