import { UsuarioResponseDto } from 'src/domain/auth/dto/usuario/usuario.response.dto';
import { IUsuarioRepositoryPort } from 'src/domain/auth/ports/usuario.repository';
import { UsuariosOrmEntity } from '../UsuariosOrmEntity';
import { QueryRunner, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UsuarioMapper } from 'src/domain/mapper/UsuarioMapper';
import { CreateUsuarioDto } from 'src/domain/auth/dto/usuario/create.request.dto';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { UpdateUsuarioDto } from 'src/domain/auth/dto/usuario/update.request.dto';
import { SucursalOrmEntity } from '../../sucursal/SucursalOrmEntity';
import { RolesOrmEntity } from '../RolesOrmEntity';
import { UserRolesOrmEntity } from '../UserRolesOrmEntity';
import { UserSucursalesOrmEntity } from '../UserSucursalesOrmEntity ';
import { NotFoundException } from '@nestjs/common';

export class UserRepositoryImpl implements IUsuarioRepositoryPort {
  constructor(
    @InjectRepository(UsuariosOrmEntity)
    private readonly repo: Repository<UsuariosOrmEntity>,
  ) {}

  async save(
    usuario: CreateUsuarioDto,
  ): Promise<GenericResponse<UsuarioResponseDto>> {
    const queryRunner = this.repo.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const save = await queryRunner.manager.insert(
        UsuariosOrmEntity,
        UsuarioMapper.createEntityFromDto(usuario),
      );
      const usuarioId = save.identifiers[0].usuarioId;
      await this.addUserSucursales(usuarioId, usuario.sucursales, queryRunner);
      await this.addUserRoles(usuarioId, usuario.roles, queryRunner);
      await queryRunner.commitTransaction();
      const response = new UsuarioResponseDto(
        usuarioId,
        usuario.correo,
        usuario.nombre ?? '',
        '1',
        usuario.roles,
        usuario.sucursales,
      );
      return {
        status: true,
        message: 'Usuario creado con éxito',
        data: response,
      };
    } catch (error: any) {
      queryRunner.rollbackTransaction();
      throw error;
    }
  }
  async findAll(sucursalId: number): Promise<UsuarioResponseDto[]> {
    const usuarios = await this.repo.find({
      where: {
        sucursales: {
          sucursalId,
        },
      },
      relations: ['roles', 'sucursales'],
    });
    return usuarios.map((us) => UsuarioMapper.toDomain(us));
  }

  async findById(
    sucursalId: number,
    usuarioId: number,
  ): Promise<UsuarioResponseDto | null> {
    const usuario = await this.repo.findOne({
      where: { usuarioId, sucursales: { sucursalId } },
      relations: ['roles', 'sucursales'],
    });
    if (!usuario)
      throw new NotFoundException(
        `No se encontró el usuario con ID ${usuarioId}`,
      );
    return UsuarioMapper.toDomain(usuario);
  }

  async findByUsername(correo: string): Promise<UsuarioResponseDto | null> {
    const usuario = await this.repo.findOne({
      where: { correo },
      relations: ['sucursales'],
    });
    if (!usuario) return null;
    return UsuarioMapper.toDomain(usuario, { incluirClave: true });
  }
  async update(
    usuarioId: number,
    usuario: UpdateUsuarioDto,
    hasRoleAndSucursalChanges: boolean,
  ): Promise<GenericResponse<UsuarioResponseDto>> {
    const queryRunner = this.repo.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      if (usuario.roles && usuario.roles.length > 0) {
        if (hasRoleAndSucursalChanges) {
          await this.removeUserRole(usuarioId, queryRunner);
          await this.addUserRoles(usuarioId, usuario.roles, queryRunner); // Agregar roles nuevos
        } else {
          // Si no es admin, no se permite agregar o eliminar roles, solo se actualizan los existentes
          usuario.roles = usuario.roles.filter((role) => role.roleId);
        }
      }
      // Validar y actualizar sucursales
      if (usuario.sucursales && usuario.sucursales.length > 0) {
        if (hasRoleAndSucursalChanges) {
          await this.removeUserSucursal(usuarioId, queryRunner);
          await this.addUserSucursales(
            usuarioId,
            usuario.sucursales ?? [],
            queryRunner,
          );
        } else {
          // Si no es admin, no se permite agregar o eliminar sucursales, solo se actualizan las existentes
          usuario.sucursales = usuario.sucursales.filter(
            (sucursal) => sucursal.sucursalId,
          );
        }
      }
      usuario.usuarioId = usuarioId;
      const update = await queryRunner.manager.save(
        UsuarioMapper.updateEntityFromDto(usuario),
      );
      await queryRunner.commitTransaction();
      return {
        status: true,
        message: hasRoleAndSucursalChanges
          ? 'La actualización del usuario fue exitosa, incluyendo la modificación de roles y sucursales.'
          : 'La actualización del usuario fue exitosa.',
        data: UsuarioMapper.toDomain(update),
      };
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      console.log(err);
      throw err;
    }
  }

  async addUserRoles(
    usuarioId: number,
    roles: RolesOrmEntity[],
    queryRunner: QueryRunner,
  ) {
    const userRoles = roles.map((role) => ({
      usuarioId,
      roleId: role.roleId,
    }));
    await queryRunner.manager.insert(UserRolesOrmEntity, userRoles);
  }
  async addUserSucursales(
    usuarioId: number,
    sucursales: SucursalOrmEntity[],
    queryRunner: QueryRunner,
  ) {
    const userSucursales = sucursales.map((sucursal) => ({
      usuarioId,
      sucursalId: sucursal.sucursalId,
    }));
    await queryRunner.manager.insert(UserSucursalesOrmEntity, userSucursales);
  }

  async removeUserRole(
    userId: number,
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(UserRolesOrmEntity)
      .where('usuarioId = :userId', { userId })
      .execute();
  }

  async removeUserSucursal(
    userId: number,
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(UserSucursalesOrmEntity)
      .where('user_id = :userId', { userId })
      .execute();
  }
  async activarSucursal(
    usuarioId: number,
    sucursalId: number,
    fechaSeleccion: Date,
  ): Promise<boolean> {
    const usuario = await this.repo.findOne({
      where: { usuarioId },
      relations: ['sucursales'],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado`);
    }
    const result: any = await this.repo.update(
      { usuarioId },
      { sucursalActiva: sucursalId, fecSelecSucursal: fechaSeleccion },
    );

    return result.affected > 0;
  }
}
