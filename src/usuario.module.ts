import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosOrmEntity } from './infrastructure/persistence/auth/UsuariosOrmEntity';
import { RolesOrmEntity } from './infrastructure/persistence/auth/RolesOrmEntity';
import { SucursalOrmEntity } from './infrastructure/persistence/sucursal/SucursalOrmEntity';
import { SerieAuditoriaOrmEntity } from './infrastructure/persistence/serie-log/SerieAuditoriaOrmEntity';
import { UsuarioController } from './adapter/web/controller/usuario.controller';
import { UsuarioService } from './domain/auth/services/usuario.service';
import { UserRepositoryImpl } from './infrastructure/persistence/auth/impl/user.repository.impl';
import { RefreshTokenOrmEntity } from './infrastructure/persistence/auth/RefreshTokenOrmEntity';
import { CreateUsersUseCase } from './application/admin/usuario/create-users.usecase';
import { UpdateUsersUseCase } from './application/admin/usuario/update-users.usecase';
import { SucursalRepositoryImpl } from './infrastructure/persistence/sucursal/sucursal.repository.impl';
import { RoleRepositoryImpl } from './infrastructure/persistence/auth/impl/role.repository.impl';
import { UserRolesOrmEntity } from './infrastructure/persistence/auth/UserRolesOrmEntity';
import { UserSucursalesOrmEntity } from './infrastructure/persistence/auth/UserSucursalesOrmEntity ';
import { GetUsersUseCase } from './application/admin/usuario/get-users.usecase';
import { GetUsuarioByIdUseCase } from './application/admin/usuario/get-users-by-id.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsuariosOrmEntity,
      RolesOrmEntity,
      SucursalOrmEntity,
      RefreshTokenOrmEntity,
      SerieAuditoriaOrmEntity,
      UserRolesOrmEntity,
      UserSucursalesOrmEntity
    ]),
  ],
  controllers: [UsuarioController],
  providers: [
    {
      provide: UsuarioService,
      useFactory: (
        userRepo: UserRepositoryImpl,
        sucursalService: SucursalRepositoryImpl,
        roleRepo: RoleRepositoryImpl
      ) => new UsuarioService(userRepo, sucursalService, roleRepo),
      inject: [UserRepositoryImpl, SucursalRepositoryImpl, RoleRepositoryImpl],
    },

    // Casos de uso
    {
      provide: CreateUsersUseCase,
      useFactory: (authService: UsuarioService) =>
        new CreateUsersUseCase(authService),
      inject: [UsuarioService],
    },
    {
      provide: UpdateUsersUseCase,
      useFactory: (authService: UsuarioService) =>
        new UpdateUsersUseCase(authService),
      inject: [UsuarioService],
    },
    {
      provide: GetUsersUseCase,
      useFactory: (authService: UsuarioService) =>
        new GetUsersUseCase(authService),
      inject: [UsuarioService],
    },
     {
      provide: GetUsuarioByIdUseCase,
      useFactory: (authService: UsuarioService) =>
        new GetUsuarioByIdUseCase(authService),
      inject: [UsuarioService],
    },

    UserRepositoryImpl,
    SucursalRepositoryImpl,
    RoleRepositoryImpl
  ],
  exports: [UsuarioService],
})
export class UsuarioModule {}
