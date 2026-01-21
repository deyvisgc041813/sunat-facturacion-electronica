
import { SucursalRepositoryImpl } from '../../../infrastructure/persistence/parent/implement/sucursal.repository.impl';
import {
  Injectable,
} from '@nestjs/common';
import { CreateUsuarioDto } from '../dto/usuario/create.request.dto';
import { CryptoUtil } from 'src/util/CryptoUtil';
import {
  RoleRequestDto,
  UsuarioResponseDto,
} from '../dto/usuario/usuario.response.dto';
import { UpdateUsuarioDto } from '../dto/usuario/update.request.dto';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { UserRole } from 'src/util/general.enum';
import { SucursalOrmEntity } from 'src/infrastructure/persistence/parent/entity/sucursal.orm.entity';
import { RolesOrmEntity } from 'src/infrastructure/persistence/auth/role.orm.entity';
import { UserRepositoryImpl } from 'src/infrastructure/persistence/auth/impl/user.repository.impl';
import { RoleRepositoryImpl } from 'src/infrastructure/persistence/auth/impl/role.repository.impl';
import { BusinessLogicException } from 'src/adapter/web/exception/exeception-dynamic';

@Injectable()
export class UsuarioService {
  constructor(
    private readonly usuarioRepo: UserRepositoryImpl,
    private readonly sucursalRepo: SucursalRepositoryImpl,
    private readonly rolesRepo: RoleRepositoryImpl,
  ) {}

  async create(
    dto: CreateUsuarioDto
  ): Promise<GenericResponse<UsuarioResponseDto>> {
    try {
      const roles = dto.roles?.map((id) => ({ roleId: id }) as RolesOrmEntity) ?? [];
      dto.clave = await CryptoUtil.hash(dto.clave);
      dto.roles = roles;
      return await this.usuarioRepo.save(dto);
      // const sucursalesIds = dto.sucursales.map((id) => id) ?? [];
      // const sucursales = await this.sucursalRepo.getByIds(
      //   sucursalesIds,
      //   empresaId,
      // );
      // if (!sucursales) {
      //   throw new BadRequestException(
      //     'Debe proporcionar al menos una sucursal.',
      //   );      // }

      // if (sucursales.length === 0) {
      //   throw new NotFoundException(
      //     `Las sucursales con los IDs ${sucursalesIds.join(',')} proporcionados no pertenecen a la empresa con ID ${empresaId}.`,
      //   );
      // }

      // const sucursalesSave =  dto.sucursales?.map(
      //     (id) => ({ sucursalId: id }) as SucursalOrmEntity,
      //   ) ?? [];

      // dto.sucursales = sucursalesSave;
    } catch (error: any) {
      throw error;
    }
  }

  async findAll(sucursalId: number): Promise<UsuarioResponseDto[]> {
    return await this.usuarioRepo.findAll();
  }

  async findOne(
    sucursalId: number,
    usuarioId: number,
  ): Promise<UsuarioResponseDto> {
    const user = await this.usuarioRepo.findById(usuarioId);
    if (!user) throw new BusinessLogicException('Usuario no encontrado');
    return user;
  }
  async update(
    usuarioId: number,
    updateDto: UpdateUsuarioDto,
    authRole: RoleRequestDto[],
  ): Promise<GenericResponse<UsuarioResponseDto>> {
    try {
      const user = await this.usuarioRepo.findById(usuarioId);
      if (!user) {
        throw new BusinessLogicException('Usuario no encontrado');
      }
      // Validar si se proporcionaron sucursales
      let hasRoleAndSucursalChanges = false;
        const rolIds: number[] = user.roles.map((rsp) => rsp.roleId) ?? [];
        const roles = await this.rolesRepo.findByIds(rolIds);
        // Verificar que todas las sucursales estén asociadas al usuario

        const rolesValidos = roles.filter((role) => user.roles.some((userRol) => userRol.roleId === role.roleId),
        );
        const esAdmin = authRole.some(
          (role) =>
            role?.nombre?.toLowerCase() === UserRole.ADMIN.toLowerCase(),
        );

        // const sucursalesDto = updateDto.sucursales ?? [];
         const rolesDto = updateDto.roles ?? [];

        if (!esAdmin) {
          if (rolesDto.length !== roles.length) {
            throw new BusinessLogicException(
              `No tienes permisos para modificar roles o sucursales. Estás intentando agregar o cambiar roles o sucursales:
            Roles intentados: ${rolesDto.map((role) => role.roleId).join(', ')},
            Solo los administradores pueden hacer estos cambios.`,
            );
          } else {
            hasRoleAndSucursalChanges = false; // No se permiten cambios si no eres admin
          }
        } else {
          hasRoleAndSucursalChanges = true; // Los admins pueden hacer los cambios
        }

        if (hasRoleAndSucursalChanges) {
          updateDto.roles = rolesDto.map(
            (id) => ({ roleId: id }) as RolesOrmEntity,
          );
        } else {
          updateDto.roles = rolesValidos.length > 0  ? rolesValidos.map( (role) => ({ roleId: role.roleId }) as RolesOrmEntity,) : [];
        }
        return this.usuarioRepo.update(
          usuarioId,
          updateDto,
          hasRoleAndSucursalChanges,
        );
    } catch (error: any) {
      throw error;
    }
  }
  async findByUsername(correo: string): Promise<UsuarioResponseDto | null> {
    return await this.usuarioRepo.findByUsername(correo);
  }
  // async remove(id: number): Promise<void> {
  //   const user = await this.findOne(id);
  //   await this.usuarioRepo.remove(user);
  // }
}
