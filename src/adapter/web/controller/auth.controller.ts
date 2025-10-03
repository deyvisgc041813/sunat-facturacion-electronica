import {
  Controller,
  Post,
  Body,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { User } from 'src/adapter/decorator/user.decorator';
import type { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { BranchSelectionUseCase } from 'src/application/auth/branch-selection.usecase copy';
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
    private readonly selectionUseCase: BranchSelectionUseCase,
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
  @UseGuards(JwtAuthGuard)
  @Post('branch-selection')
  async seleccionarSucursal(
    @Body() body: { sucursalId: number },
    @User() auth: IUserPayload,
  ) {
    if (!body.sucursalId || body.sucursalId <= 0) {
      throw new BadRequestException('Debe seleccionar una sucursal válida');
    }
    return this.selectionUseCase.execute(body.sucursalId, auth);
  }
}
