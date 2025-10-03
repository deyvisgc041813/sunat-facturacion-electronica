import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsuariosOrmEntity } from './infrastructure/persistence/auth/UsuariosOrmEntity';
import { SucursalOrmEntity } from './infrastructure/persistence/sucursal/SucursalOrmEntity';
import { AuthController } from './adapter/web/controller/auth.controller';
import { AuthService } from './domain/auth/services/auth.service';
import { UserRepositoryImpl } from './infrastructure/persistence/auth/impl/user.repository.impl';
import { JwtAdapter } from './infrastructure/persistence/auth/security/jwt.adapter';
import { RefreshTokenRepositoryImpl } from './infrastructure/persistence/auth/impl/refresh-token.repository.impl';
import { LoginUseCase } from './application/auth/login.usecase';
import { RefreshTokenUseCase } from './application/auth/refresh-token.usecase';
import { LogoutUseCase } from './application/auth/logout.usecase';
import { JwtStrategy } from './adapter/guards/jwt.strategy';
import { RolesOrmEntity } from './infrastructure/persistence/auth/RolesOrmEntity';
import { SerieAuditoriaOrmEntity } from './infrastructure/persistence/serie-log/SerieAuditoriaOrmEntity';
import { RefreshTokenOrmEntity } from './infrastructure/persistence/auth/RefreshTokenOrmEntity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BranchSelectionUseCase } from './application/auth/branch-selection.usecase copy';

// Entities
@Module({
  imports: [
    TypeOrmModule.forFeature([UsuariosOrmEntity, RolesOrmEntity, SucursalOrmEntity, RefreshTokenOrmEntity,SerieAuditoriaOrmEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'supersecreto',
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
     // Guard
    JwtStrategy,
    // Domain service principal
    {
      provide: AuthService,
      useFactory: (
        userRepo: UserRepositoryImpl,
        tokenService: JwtAdapter,
        refreshRepo: RefreshTokenRepositoryImpl,
      ) => new AuthService(userRepo, tokenService, refreshRepo),
        inject: [UserRepositoryImpl, JwtAdapter, RefreshTokenRepositoryImpl],
    },

    // Casos de uso
    {
      provide: LoginUseCase,
      useFactory: (authService: AuthService) => new LoginUseCase(authService),
      inject: [AuthService],
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (authService: AuthService) => new RefreshTokenUseCase(authService),
      inject: [AuthService],
    },
    {
      provide: LogoutUseCase,
      useFactory: (authService: AuthService) => new LogoutUseCase(authService),
      inject: [AuthService],
    },
    {
      provide: BranchSelectionUseCase,
      useFactory: (authService: AuthService) => new BranchSelectionUseCase(authService),
      inject: [AuthService],
    },
    

    // Adapters
    UserRepositoryImpl,
    RefreshTokenRepositoryImpl,
    JwtAdapter,
  ],
  
  exports: [LoginUseCase, RefreshTokenUseCase, LogoutUseCase,  JwtStrategy],
})
export class AuthModule {
    constructor() {}
}
