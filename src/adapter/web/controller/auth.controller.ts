import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { User } from 'src/adapter/decorator/user.decorator';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { LoginUseCase } from 'src/application/auth/login.usecase';
import { LogoutUseCase } from 'src/application/auth/logout.usecase';
import { RefreshTokenUseCase } from 'src/application/auth/refresh-token.usecase';
import { LoginDto } from 'src/domain/auth/dto/login.request.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.loginUseCase.execute(body.correo, body.clave);
  }

  @Post('refresh')
  async refresh(@Body() body: { refresh_token: string }) {
    return this.refreshTokenUseCase.execute(body.refresh_token);
  }
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@User() user: any) {
    return this.logoutUseCase.execute(user?.userId);
  }
}
