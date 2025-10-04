import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteOrmEntity } from './infrastructure/persistence/cliente/ClienteOrmEntity';
import { EmpresaOrmEntity } from './infrastructure/persistence/empresa/EmpresaOrmEntity';
import { EmpresaRepositoryImpl } from './infrastructure/persistence/empresa/empresa.repository.impl';
import { ComprobanteOrmEntity } from './infrastructure/persistence/comprobante/ComprobanteOrmEntity';
import { EmpresaController } from './adapter/web/controller/empresa.controller';
import { ProductoOrmEntity } from './infrastructure/persistence/producto/ProductoOrmEntity';
import { EmpresaService } from './domain/empresa/services/empresa.service';
import { CreateEmpresaUseCase } from './application/Empresa/create.usecase';
import { GetAllEmpresaUseCase } from './application/Empresa/get-all.usecase';
import { GetByIdEmpresaUseCase } from './application/Empresa/get-by-id.usecase';
import { UpdateEmpresaUseCase } from './application/Empresa/update.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmpresaOrmEntity,
      ClienteOrmEntity,
      ComprobanteOrmEntity,
      ProductoOrmEntity,
    ]),
  ],
  controllers: [EmpresaController],
  providers: [
    {
      provide: EmpresaService,
      useFactory: (empresaRepo: EmpresaRepositoryImpl) =>
        new EmpresaService(empresaRepo),
      inject: [EmpresaRepositoryImpl],
    },

    // Casos de uso
    {
      provide: CreateEmpresaUseCase,
      useFactory: (empresaService: EmpresaService) =>
        new CreateEmpresaUseCase(empresaService),
      inject: [EmpresaService],
    },
    {
      provide: GetAllEmpresaUseCase,
      useFactory: (empresaService: EmpresaService) =>
        new GetAllEmpresaUseCase(empresaService),
      inject: [EmpresaService],
    },
    {
      provide: GetByIdEmpresaUseCase,
      useFactory: (empresaService: EmpresaService) =>
        new GetByIdEmpresaUseCase(empresaService),
      inject: [EmpresaService],
    },
      {
      provide: UpdateEmpresaUseCase,
      useFactory: (empresaService: EmpresaService) =>
        new UpdateEmpresaUseCase(empresaService),
      inject: [EmpresaService],
    },

    EmpresaRepositoryImpl,
  ],
  exports: [EmpresaRepositoryImpl],
})
export class EmpresaModule {}

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([
//       UsuariosOrmEntity,
//       RolesOrmEntity,
//       SucursalOrmEntity,
//       RefreshTokenOrmEntity,
//       SerieAuditoriaOrmEntity,
//       UserRolesOrmEntity,
//       UserSucursalesOrmEntity
//     ]),
//   ],
//   controllers: [UsuarioController],
//   providers: [
//     {
//       provide: UsuarioService,
//       useFactory: (
//         userRepo: UserRepositoryImpl,
//         sucursalService: SucursalRepositoryImpl,
//         roleRepo: RoleRepositoryImpl
//       ) => new UsuarioService(userRepo, sucursalService, roleRepo),
//       inject: [UserRepositoryImpl, SucursalRepositoryImpl, RoleRepositoryImpl],
//     },

//     // Casos de uso
//     {
//       provide: CreateUsersUseCase,
//       useFactory: (authService: UsuarioService) =>
//         new CreateUsersUseCase(authService),
//       inject: [UsuarioService],
//     },
//     {
//       provide: UpdateUsersUseCase,
//       useFactory: (authService: UsuarioService) =>
//         new UpdateUsersUseCase(authService),
//       inject: [UsuarioService],
//     },
//     {
//       provide: GetUsersUseCase,
//       useFactory: (authService: UsuarioService) =>
//         new GetUsersUseCase(authService),
//       inject: [UsuarioService],
//     },
//      {
//       provide: GetUsuarioByIdUseCase,
//       useFactory: (authService: UsuarioService) =>
//         new GetUsuarioByIdUseCase(authService),
//       inject: [UsuarioService],
//     },

//     UserRepositoryImpl,
//     SucursalRepositoryImpl,
//     RoleRepositoryImpl
//   ],
//   exports: [UsuarioService],
// })
// export class UsuarioModule {}
