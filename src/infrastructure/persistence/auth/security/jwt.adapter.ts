import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ITokenServicePort } from 'src/domain/auth/ports/token.repository';
@Injectable()
export class JwtAdapter implements ITokenServicePort {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(payload: any): string {
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  signRefreshToken(payload: any): string {
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  verify(token: string): any {
    return this.jwtService.verify(token);
  }
}
