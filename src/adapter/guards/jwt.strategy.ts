import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'supersecreto',
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.userId,
      empresaId: payload.empresaId,
      roles: payload.roles,
      correo: payload.username,
      nombre: payload.nombre,
      sucursalActiva: payload.sucursalActiva,
      sucursales: payload.sucursales,
    };
  }
}