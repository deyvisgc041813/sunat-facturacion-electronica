import { RefreshTokenDto } from "../dto/refresh.token.dto";


export interface IRefreshTokenRepositoryPort {
  save(token: RefreshTokenDto): Promise<void>;
  find(token: string): Promise<RefreshTokenDto | null>;
  revokeByUser(userId: number): Promise<void>;
}