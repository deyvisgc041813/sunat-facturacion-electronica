import { AuthService } from "src/domain/auth/services/auth.service";


export class LogoutUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(usuarioId: number) {
    return this.authService.logout(usuarioId);
  }
}