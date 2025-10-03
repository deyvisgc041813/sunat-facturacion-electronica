import { UsuarioService } from "src/domain/auth/services/usuario.service";


export class GetUsuarioByIdUseCase {
  constructor(private readonly usuarioService: UsuarioService) {}

  async execute(sucursalId:number, usuarioId:number) {
    return this.usuarioService.findOne(sucursalId, usuarioId);
  }
}