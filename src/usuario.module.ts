import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerieAuditoriaOrmEntity } from './infrastructure/persistence/tenant/entity/serie-comprobante/serie-auditoria.orm.entity';
import { UsuarioController } from './adapter/web/controller/parent/usuario.controller';
import { UsuarioService } from './domain/auth/services/usuario.service';
import { SucursalRepositoryImpl } from './infrastructure/persistence/parent/implement/sucursal.repository.impl';
import { SucursalOrmEntity } from './infrastructure/persistence/parent/entity/sucursal.orm.entity';
import { GetUsersUseCase } from './application/auth/usuario/get-users.usecase';
import { GetUsuarioByIdUseCase } from './application/auth/usuario/get-users-by-id.usecase';
import { UpdateUsersUseCase } from './application/auth/usuario/update-users.usecase';
import { CreateUsersUseCase } from './application/auth/usuario/create-users.usecase';
import { UsuariosOrmEntity } from './infrastructure/persistence/auth/usuario.orm.entity';
import { RolesOrmEntity } from './infrastructure/persistence/auth/role.orm.entity';
import { RefreshTokenOrmEntity } from './infrastructure/persistence/auth/refresh-token.orm.entity';
import { UserRolesOrmEntity } from './infrastructure/persistence/auth/user-role.orm.entity';
import { UserSucursalesOrmEntity } from './infrastructure/persistence/auth/user-sucursal.orm.entity';
import { UserRepositoryImpl } from './infrastructure/persistence/auth/impl/user.repository.impl';
import { RoleRepositoryImpl } from './infrastructure/persistence/auth/impl/role.repository.impl';

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
