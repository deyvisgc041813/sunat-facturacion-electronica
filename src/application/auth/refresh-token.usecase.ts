import { AuthService } from "src/domain/auth/services/auth.service";


export class RefreshTokenUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }
}