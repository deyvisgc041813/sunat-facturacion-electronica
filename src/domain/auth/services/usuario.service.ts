import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {  Repository } from "typeorm";
import { RolesOrmEntity } from "src/infrastructure/persistence/auth/RolesOrmEntity";
import { SucursalOrmEntity } from "src/infrastructure/persistence/sucursal/SucursalOrmEntity";
import { CreateUsuarioDto } from "../dto/usuario/create.request.dto";
import { CryptoUtil } from "src/util/CryptoUtil";
import { UserRepositoryImpl } from "src/infrastructure/persistence/auth/impl/user.repository.impl";
import { UsuarioResponseDto } from "../dto/usuario/usuario.response.dto";

@Injectable()
export class UsuarioService {
  constructor(
    private readonly usuarioRepo: UserRepositoryImpl, // usa la interfaz
    @InjectRepository(RolesOrmEntity)
    private readonly roleRepo: Repository<RolesOrmEntity>,
    @InjectRepository(SucursalOrmEntity)
    private readonly sucursalRepo: Repository<SucursalOrmEntity>,
  ) {}

  async create(dto: CreateUsuarioDto): Promise<{status: boolean, message: string, data?: UsuarioResponseDto}> {
    try {
    const roles = dto.roles?.map(id => ({ roleId: id } as RolesOrmEntity)) ?? [];
    const sucursales = dto.sucursales?.map(id => ({ sucursalId: id } as SucursalOrmEntity)) ?? [];
    dto.clave =  await CryptoUtil.hash(dto.clave) 
    dto.roles = roles
    dto.sucursales = sucursales
    return await this.usuarioRepo.save(dto);
    } catch(error: any) {
      throw error
    }
  }

  async findAll(): Promise<UsuarioResponseDto[]> {
    return await this.usuarioRepo.findAll();
  }

  async findOne(id: number): Promise<UsuarioResponseDto> {
    const user = await this.usuarioRepo.findById(id)
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  // async update(id: number, dto: any): Promise<UsuariosOrmEntity> {
  //   const user = await this.findOne(id);

  //   if (dto.rolesIds) {
  //     user.roles = await this.roleRepo.find({ where: { roleId: In(dto.rolesIds) } });
  //   }

  //   if (dto.sucursalesIds) {
  //     user.sucursales = await this.sucursalRepo.find({ where: { sucursalId: In(dto.sucursalesIds) } });
  //   }

  //   Object.assign(user, dto);

  //   return this.usuarioRepo.save(user);
  // }

  // async remove(id: number): Promise<void> {
  //   const user = await this.findOne(id);
  //   await this.usuarioRepo.remove(user);
  // }
}
