import { SucursalRepositoryImpl } from './../../../infrastructure/persistence/sucursal/sucursal.repository.impl';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RolesOrmEntity } from 'src/infrastructure/persistence/auth/RolesOrmEntity';
import { SucursalOrmEntity } from 'src/infrastructure/persistence/sucursal/SucursalOrmEntity';
import { CreateUsuarioDto } from '../dto/usuario/create.request.dto';
import { CryptoUtil } from 'src/util/CryptoUtil';
import { UserRepositoryImpl } from 'src/infrastructure/persistence/auth/impl/user.repository.impl';
import {
  RoleRequestDto,
  UsuarioResponseDto,
} from '../dto/usuario/usuario.response.dto';
import { UpdateUsuarioDto } from '../dto/usuario/update.request.dto';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { UserRole } from 'src/util/general.enum';
import { RoleRepositoryImpl } from 'src/infrastructure/persistence/auth/impl/role.repository.impl';

@Injectable()
export class UsuarioService {
  constructor(
    private readonly usuarioRepo: UserRepositoryImpl,
    private readonly sucursalRepo: SucursalRepositoryImpl,
    private readonly rolesRepo: RoleRepositoryImpl,
  ) {}

  async create(
    dto: CreateUsuarioDto,
    empresaId: number,
  ): Promise<GenericResponse<UsuarioResponseDto>> {
    try {
      const sucursalesIds = dto.sucursales.map((id) => id) ?? [];
      const sucursales = await this.sucursalRepo.findByIds(
        sucursalesIds,
        empresaId,
      );
      if (!sucursales) {
        throw new BadRequestException(
          'Debe proporcionar al menos una sucursal.',
        );
      }

      if (sucursales.length === 0) {
        throw new NotFoundException(
          `Las sucursales con los IDs ${sucursalesIds.join(',')} proporcionados no pertenecen a la empresa con ID ${empresaId}.`,
        );
      }
      const roles =
        dto.roles?.map((id) => ({ roleId: id }) as RolesOrmEntity) ?? [];
      const sucursalesSave =
        dto.sucursales?.map(
          (id) => ({ sucursalId: id }) as SucursalOrmEntity,
        ) ?? [];
      dto.clave = await CryptoUtil.hash(dto.clave);
      dto.roles = roles;
      dto.sucursales = sucursalesSave;
      return await this.usuarioRepo.save(dto);
    } catch (error: any) {
      throw error;
    }
  }

  async findAll(sucursalId: number): Promise<UsuarioResponseDto[]> {
    return await this.usuarioRepo.findAll(sucursalId);
  }

  async findOne(
    sucursalId: number,
    usuarioId: number,
  ): Promise<UsuarioResponseDto> {
    const user = await this.usuarioRepo.findById(sucursalId, usuarioId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
  async update(
    usuarioId: number,
    empresaId: number,
    sucursalId: number,
    updateDto: UpdateUsuarioDto,
    authRole: RoleRequestDto[],
  ): Promise<GenericResponse<UsuarioResponseDto>> {
    try {
      const user = await this.usuarioRepo.findById(sucursalId, usuarioId);
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }
      // Validar si se proporcionaron sucursales
      let hasRoleAndSucursalChanges = false;
      if (user.sucursales.length > 0) {
        const sucursalIds: number[] =
          user.sucursales.map((rsp) => rsp.sucursalId) ?? [];
        const sucursales = await this.sucursalRepo.findByIds(
          sucursalIds,
          empresaId,
        );
        const rolIds: number[] = user.roles.map((rsp) => rsp.roleId) ?? [];
        const roles = await this.rolesRepo.findByIds(rolIds);

        if (sucursales.length === 0) {
          throw new NotFoundException(
            `Las sucursales con los IDs proporcionados no pertenecen a la empresa con ID ${empresaId}.`,
          );
        }

        // Verificar que todas las sucursales estén asociadas al usuario
        const sucursalesValidas = sucursales.filter((sucursal) =>
          user.sucursales.some(
            (userSucursal) => userSucursal.sucursalId === sucursal.sucursalId,
          ),
        );

        const rolesValidos = roles.filter((role) =>
          user.roles.some((userRol) => userRol.roleId === role.roleId),
        );
        const esAdmin = authRole.some(
          (role) =>
            role?.nombre?.toLowerCase() === UserRole.ADMIN.toLowerCase(),
        );

        const sucursalesDto = updateDto.sucursales ?? [];
        const rolesDto = updateDto.roles ?? [];

        if (!esAdmin) {
          if (
            sucursalesDto.length !== sucursales.length ||
            rolesDto.length !== roles.length
          ) {
            throw new NotFoundException(
              `No tienes permisos para modificar roles o sucursales. Estás intentando agregar o cambiar roles o sucursales:
            Roles intentados: ${rolesDto.map((role) => role.roleId).join(', ')}, 
            Sucursales intentadas: ${sucursalesDto.map((sucursal) => sucursal.sucursalId).join(', ')}. 
            Solo los administradores pueden hacer estos cambios.`,
            );
          } else {
            hasRoleAndSucursalChanges = false; // No se permiten cambios si no eres admin
          }
        } else {
          hasRoleAndSucursalChanges = true; // Los admins pueden hacer los cambios
        }

        if (hasRoleAndSucursalChanges) {
          // Si es admin y no encontró los roles o sucursales en la BD, se asignan desde el DTO
          updateDto.sucursales = sucursalesDto.map(
            (id) => ({ sucursalId: id }) as SucursalOrmEntity,
          );
          updateDto.roles = rolesDto.map(
            (id) => ({ roleId: id }) as RolesOrmEntity,
          );
        } else {
          // Si no es admin, solo actualizamos los roles y sucursales existentes
          updateDto.sucursales =
            sucursalesValidas.length > 0
              ? sucursalesValidas.map(
                  (sucursal) =>
                    ({ sucursalId: sucursal.sucursalId }) as SucursalOrmEntity,
                )
              : [];

          updateDto.roles =
            rolesValidos.length > 0
              ? rolesValidos.map(
                  (role) => ({ roleId: role.roleId }) as RolesOrmEntity,
                )
              : [];
        }
        return this.usuarioRepo.update(
          usuarioId,
          updateDto,
          hasRoleAndSucursalChanges,
        );
      } else {
        throw new NotFoundException(
          'El usuario no tiene sucursales habilitadas.',
        );
      }
    } catch (error: any) {
      throw error;
    }
  }

  // async remove(id: number): Promise<void> {
  //   const user = await this.findOne(id);
  //   await this.usuarioRepo.remove(user);
  // }
}
