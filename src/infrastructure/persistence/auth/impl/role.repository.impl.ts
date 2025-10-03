import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { IRoleRepositoryPort } from 'src/domain/auth/ports/role.repository';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { RoleRequestDto } from 'src/domain/auth/dto/usuario/usuario.response.dto';
import { RolesOrmEntity } from '../RolesOrmEntity';
import { RoleMapper } from 'src/domain/mapper/RoleMapper';


export class RoleRepositoryImpl implements IRoleRepositoryPort {
  constructor(
    @InjectRepository(RolesOrmEntity)
    private readonly repo: Repository<RolesOrmEntity>,
  ) {}

  save(usuario: any): Promise<GenericResponse<RoleRequestDto>> {
    throw new Error('Method not implemented.');
  }
  findAll(): Promise<RoleRequestDto[]> {
    throw new Error('Method not implemented.');
  }
  findById(usuarioId: number): Promise<RoleRequestDto | null> {
    throw new Error('Method not implemented.');
  }
  findByUsername(username: string): Promise<RoleRequestDto | null> {
    throw new Error('Method not implemented.');
  }
  update(usuario: any): Promise<GenericResponse<RoleRequestDto>> {
    throw new Error('Method not implemented.');
  }
  async findByIds(
    roleId: number[]
  ): Promise<RoleRequestDto[]> {
    const sucursales = await this.repo.find({
      where: {
        roleId: In(roleId)
      },
    });
    return sucursales.map((rsp) => RoleMapper.toDomain(rsp));
  }
}
