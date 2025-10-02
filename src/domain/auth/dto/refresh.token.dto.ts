export class RefreshTokenDto {
  constructor(
    public readonly token: string,
    public readonly userId: number,
    public isRevoked: boolean,
    public expiresAt: Date,
  ) {}
}
