import { InjectRepository } from '@nestjs/typeorm';
import { RefreshTokenDto } from 'src/domain/auth/dto/refresh.token.dto';
import { IRefreshTokenRepositoryPort } from 'src/domain/auth/ports/refresh.repository.token';
import { Repository } from 'typeorm';
import { RefreshTokenMapper } from 'src/domain/mapper/RefreshTokenMapper';
import { RefreshTokenOrmEntity } from '../RefreshTokenOrmEntity';

export class RefreshTokenRepositoryImpl implements IRefreshTokenRepositoryPort {
  constructor(
    @InjectRepository(RefreshTokenOrmEntity)
    private readonly repo: Repository<RefreshTokenOrmEntity>,
  ) {}

  async save(refresh: RefreshTokenDto): Promise<void> {
    await this.repo.save(RefreshTokenMapper.toDomainToOrm(refresh));
  }

  async find(token: string): Promise<RefreshTokenDto | null> {
    const data = (await this.repo.findOne({ where: { token } })) || null;
    if (!data) return null;
    return RefreshTokenMapper.toDomain(data);
  }
  //t => t.token === token
  async revokeByUser(usuarioId: number): Promise<void> {
    await this.repo.delete({ user: { usuarioId } });
  }
}
