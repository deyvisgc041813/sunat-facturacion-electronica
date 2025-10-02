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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsuariosOrmEntity,
      RolesOrmEntity,
      SucursalOrmEntity,
      RefreshTokenOrmEntity,
      SerieAuditoriaOrmEntity,
    ])
  ],
  controllers: [UsuarioController],
  providers: [UsuarioService, UserRepositoryImpl],
  exports: [UsuarioService]
})
export class UsuarioModule {}