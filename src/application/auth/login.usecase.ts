import { AuthService } from "src/domain/auth/services/auth.service";


export class LoginUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(username: string, password: string) {
    return this.authService.login(username, password);
  }
}