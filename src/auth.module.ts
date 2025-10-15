import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './adapter/web/controller/auth.controller';
import { AuthService } from './domain/auth/services/auth.service';
import { JwtAdapter } from './infrastructure/persistence/parent/security/jwt.adapter';
import { LoginUseCase } from './application/auth/login.usecase';
import { RefreshTokenUseCase } from './application/auth/refresh-token.usecase';
import { LogoutUseCase } from './application/auth/logout.usecase';
import { JwtStrategy } from './adapter/guards/jwt.strategy';
import { SerieAuditoriaOrmEntity } from './infrastructure/persistence/tenant/entity/serie-comprobante/serie-auditoria.orm.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BranchSelectionUseCase } from './application/auth/branch-selection.usecase';
import { SucursalOrmEntity } from './infrastructure/persistence/parent/entity/sucursal.orm.entity';
import { RefreshTokenRepositoryImpl } from './infrastructure/persistence/auth/impl/refresh-token.repository.impl';
import { UsuariosOrmEntity } from './infrastructure/persistence/auth/usuario.orm.entity';
import { RefreshTokenOrmEntity } from './infrastructure/persistence/auth/refresh-token.orm.entity';
import { UserRepositoryImpl } from './infrastructure/persistence/auth/impl/user.repository.impl';
import { SucursalService } from './domain/parent/sucursal/service/sucursal.service';
import { SucursalModule } from './sucursal.module';
import { config } from 'process';

// Entities
@Module({
  imports: [
    TypeOrmModule.forFeature([ UsuariosOrmEntity, RefreshTokenOrmEntity, SucursalOrmEntity, SerieAuditoriaOrmEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({

        secret: config.get<string>('JWT_SECRET') || 'supersecreto',
        //signOptions: { expiresIn: '15m' },
        //signOptions: config.get<boolean>('TOKEN_EXPIRABLE') ? { expiresIn: '15m' } : {},
      }),
    }),
    SucursalModule
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
        sucursalService:SucursalService
      ) => new AuthService(userRepo, tokenService, refreshRepo, sucursalService),
        inject: [UserRepositoryImpl, JwtAdapter, RefreshTokenRepositoryImpl, SucursalService],
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
  
  exports: [LoginUseCase, RefreshTokenUseCase, LogoutUseCase,  JwtStrategy, AuthService],
})
export class AuthModule {
    constructor() {}
}
