import { CryptoUtil } from 'src/util/CryptoUtil';
import { RefreshTokenDto } from '../dto/refresh.token.dto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepositoryImpl } from 'src/infrastructure/persistence/auth/impl/user.repository.impl';
import { RefreshTokenRepositoryImpl } from 'src/infrastructure/persistence/auth/impl/refresh-token.repository.impl';
import { JwtAdapter } from 'src/infrastructure/persistence/auth/security/jwt.adapter';
import { formatDateForSunat, getFechaHoraActualLima, getFechaHoyYYYYMMDD } from 'src/util/Helpers';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepositoryImpl,
    private readonly tokenService: JwtAdapter,
    private readonly refreshRepo: RefreshTokenRepositoryImpl,
  ) {}

  async login(username: string, password: string) {
    const user = await this.userRepo.findByUsername(username);
    if (!user || !(await CryptoUtil.compare(password, user.clave ?? ''))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const hoy = getFechaHoraActualLima().toISOString().split('T')[0]; // yyyy-mm-dd
    let sucursalActivaId = 0;
    const fechaSelec: Date | null = user.fecSelecSucursal ?? null;
    if (user.sucursalActiva && user.sucursalActiva > 0 && formatDateForSunat(fechaSelec) === hoy) {
      // Si ya tiene sucursal activa hoy
      sucursalActivaId = user.sucursalActiva;
    }
    await this.refreshRepo.revokeByUser(user.usuarioId);
    const payload = {
      sub: user.usuarioId,
      empresaId: user.sucursales?.[0]?.empresa?.empresaId ?? null,
      username: user.correo,
      roles: user.roles,
      sucursales: user.sucursales.map((s) => s.sucursalId),
      nombre: user.nombre,
      sucursalActiva: sucursalActivaId,
    };
    const accessToken = this.tokenService.signAccessToken(payload);
    const refreshTokenStr = this.tokenService.signRefreshToken(payload);

    const refreshToken = new RefreshTokenDto(
      refreshTokenStr,
      user.usuarioId,
      false,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    );
    await this.refreshRepo.save(refreshToken);
    return {
      access_token: accessToken,
      refresh_token: refreshTokenStr,
      sucursalActiva: sucursalActivaId > 0,
    };
  }

  async refresh(refreshToken: string) {
    const stored = await this.refreshRepo.find(refreshToken);
    if (!stored || stored.expiresAt < new Date()) {
      throw new BadRequestException('Refresh token inválido');
    }
    // Verificar firma y extraer payload
    const decoded = this.tokenService.verify(refreshToken);
    //Crear un payload limpio SIN exp ni iat
    const payload = {
      sub: decoded?.sub,
      empresaId: decoded?.empresaId,
      username: decoded?.username,
      roles: decoded?.roles,
      sucursales: decoded?.sucursales,
      nombre: decoded?.nombre,
    };

    return { access_token: this.tokenService.signAccessToken(payload) };
  }
  async branchActive(sucursalId: number, auth: IUserPayload) {
    // Validar que la sucursal elegida pertenece al usuario
    const sucursalesIds = auth.sucursales.map((id) => id);
    if (!sucursalesIds.includes(sucursalId)) {
      throw new ForbiddenException('No tiene acceso a esta sucursal');
    }
    await this.userRepo.activarSucursal(auth.userId, sucursalId, new Date());
    // Generar nuevo token JWT con la sucursal activa
    console.log(auth)
    const payload = {
      sub: auth.userId,
      username: auth.correo,
      roles: auth.roles,
      sucursales: sucursalesIds,
      nombre: auth.nombre,
      sucursalActiva: sucursalId,
    };
    const accessToken = this.tokenService.signAccessToken(payload);
    const refreshTokenStr = this.tokenService.signRefreshToken(payload);
    const refreshToken = new RefreshTokenDto(
      refreshTokenStr,
      auth.userId,
      false,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    );
    await this.refreshRepo.save(refreshToken);
    return {
      access_token: accessToken,
      refresh_token: refreshTokenStr,
      sucursalActiva: sucursalId,
    };
  }
  async logout(usuarioId: number) {
    await this.refreshRepo.revokeByUser(usuarioId);
  }
}
