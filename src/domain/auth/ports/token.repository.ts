export interface ITokenServicePort {
  signAccessToken(payload: any): string;
  signRefreshToken(payload: any): string;
  verify(token: string): any;
}