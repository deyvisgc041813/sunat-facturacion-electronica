import { Injectable, NotFoundException } from "@nestjs/common";
import { SucursalRepositoryImpl } from "src/infrastructure/persistence/sucursal/sucursal.repository.impl";
import { CreateSucursalDto } from "../dto/create.request.dto";
import { GenericResponse } from "src/adapter/web/response/response.interface";
import { SucursalResponseDto } from "../dto/sucursal.response.dto";
import { IUserPayload } from "src/adapter/decorator/user.decorator.interface";
import { SucursalMapper } from "src/domain/mapper/SucursalMapper";


@Injectable()
export class SucursalService {
  constructor(
    private readonly sucursalRepo: SucursalRepositoryImpl
  ) {}

  async create(dto: CreateSucursalDto, auth: IUserPayload): Promise<GenericResponse<SucursalResponseDto>> {
    try {
      dto.usuarioRegistro = auth.correo
      return await this.sucursalRepo.save(dto);
    } catch (error: any) {
      throw error;
    }
  }

  async getAll(empresaId:number): Promise<SucursalResponseDto[]> {
    return await this.sucursalRepo.getSucursalesByEmpresa(empresaId);
  }

  async getById(
    sucursalId: number,
    empresaId: number,
  ): Promise<SucursalResponseDto[]> {
    const sucursal = await this.sucursalRepo.getByIds([sucursalId], empresaId);
    if (!sucursal) throw new NotFoundException('sucursal no encontrada');
    return sucursal;
  }
//   async update(
//     usuarioId: number,
//     empresaId: number,
//     sucursalId: number,
//     updateDto: UpdateUsuarioDto,
//     authRole: RoleRequestDto[],
//   ): Promise<GenericResponse<UsuarioResponseDto>> {
//     try {
//       const user = await this.usuarioRepo.findById(sucursalId, usuarioId);
//       if (!user) {
//         throw new NotFoundException('Usuario no encontrado');
//       }
//       // Validar si se proporcionaron sucursales
//       let hasRoleAndSucursalChanges = false;
//       if (user.sucursales.length > 0) {
//         const sucursalIds: number[] =
//           user.sucursales.map((rsp) => rsp.sucursalId) ?? [];
//         const sucursales = await this.sucursalRepo.findByIds(
//           sucursalIds,
//           empresaId,
//         );
//         const rolIds: number[] = user.roles.map((rsp) => rsp.roleId) ?? [];
//         const roles = await this.rolesRepo.findByIds(rolIds);

//         if (sucursales.length === 0) {
//           throw new NotFoundException(
//             `Las sucursales con los IDs proporcionados no pertenecen a la empresa con ID ${empresaId}.`,
//           );
//         }

//         // Verificar que todas las sucursales estén asociadas al usuario
//         const sucursalesValidas = sucursales.filter((sucursal) =>
//           user.sucursales.some(
//             (userSucursal) => userSucursal.sucursalId === sucursal.sucursalId,
//           ),
//         );

//         const rolesValidos = roles.filter((role) =>
//           user.roles.some((userRol) => userRol.roleId === role.roleId),
//         );
//         const esAdmin = authRole.some(
//           (role) =>
//             role?.nombre?.toLowerCase() === UserRole.ADMIN.toLowerCase(),
//         );

//         const sucursalesDto = updateDto.sucursales ?? [];
//         const rolesDto = updateDto.roles ?? [];

//         if (!esAdmin) {
//           if (
//             sucursalesDto.length !== sucursales.length ||
//             rolesDto.length !== roles.length
//           ) {
//             throw new NotFoundException(
//               `No tienes permisos para modificar roles o sucursales. Estás intentando agregar o cambiar roles o sucursales:
//             Roles intentados: ${rolesDto.map((role) => role.roleId).join(', ')}, 
//             Sucursales intentadas: ${sucursalesDto.map((sucursal) => sucursal.sucursalId).join(', ')}. 
//             Solo los administradores pueden hacer estos cambios.`,
//             );
//           } else {
//             hasRoleAndSucursalChanges = false; // No se permiten cambios si no eres admin
//           }
//         } else {
//           hasRoleAndSucursalChanges = true; // Los admins pueden hacer los cambios
//         }

//         if (hasRoleAndSucursalChanges) {
//           // Si es admin y no encontró los roles o sucursales en la BD, se asignan desde el DTO
//           updateDto.sucursales = sucursalesDto.map(
//             (id) => ({ sucursalId: id }) as SucursalOrmEntity,
//           );
//           updateDto.roles = rolesDto.map(
//             (id) => ({ roleId: id }) as RolesOrmEntity,
//           );
//         } else {
//           // Si no es admin, solo actualizamos los roles y sucursales existentes
//           updateDto.sucursales =
//             sucursalesValidas.length > 0
//               ? sucursalesValidas.map(
//                   (sucursal) =>
//                     ({ sucursalId: sucursal.sucursalId }) as SucursalOrmEntity,
//                 )
//               : [];

//           updateDto.roles =
//             rolesValidos.length > 0
//               ? rolesValidos.map(
//                   (role) => ({ roleId: role.roleId }) as RolesOrmEntity,
//                 )
//               : [];
//         }
//         return this.usuarioRepo.update(
//           usuarioId,
//           updateDto,
//           hasRoleAndSucursalChanges,
//         );
//       } else {
//         throw new NotFoundException(
//           'El usuario no tiene sucursales habilitadas.',
//         );
//       }
//     } catch (error: any) {
//       throw error;
//     }
//   }

  // async remove(id: number): Promise<void> {
  //   const user = await this.findOne(id);
  //   await this.usuarioRepo.remove(user);
  // }
}
