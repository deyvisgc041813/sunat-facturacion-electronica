export interface ITokenServicePort {
  signAccessToken(payload: any, expiresIn: { expiresIn: '15m' }): string;
  signRefreshToken(payload: any): string;
  verify(token: string): any;
}