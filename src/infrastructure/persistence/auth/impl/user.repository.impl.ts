import { UsuarioResponseDto } from 'src/domain/auth/dto/usuario/usuario.response.dto';
import { IUsuarioRepositoryPort } from 'src/domain/auth/ports/usuario.repository';
import { UsuariosOrmEntity } from '../UsuariosOrmEntity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UsuarioMapper } from 'src/domain/mapper/UsuarioMapper';
import { CreateUsuarioDto } from 'src/domain/auth/dto/usuario/create.request.dto';

export class UserRepositoryImpl implements IUsuarioRepositoryPort {
  constructor(
    @InjectRepository(UsuariosOrmEntity)
    private readonly repo: Repository<UsuariosOrmEntity>,
  ) {}
  async save(
    usuario: CreateUsuarioDto,
  ): Promise<{ status: boolean; message: string; data?: UsuarioResponseDto }> {
    const save = await this.repo.save(usuario);
    return {
      status: true,
      message: 'Usuario creado con éxito',
      data: UsuarioMapper.toDomain(save),
    };
  }
  async findAll(): Promise<UsuarioResponseDto[]> {
    const usuarios = await this.repo.find({
      relations: ['roles', 'sucursales', 'auditorias'],
    });
    return usuarios.map((us) => UsuarioMapper.toDomain(us));
  }
 async findById(usuarioId: number): Promise<UsuarioResponseDto | null> {
    const usuario = await this.repo.findOne({ where: {usuarioId},
      relations: ['roles', 'sucursales', 'auditorias'],
    });
    if(!usuario) return null
    return UsuarioMapper.toDomain(usuario)
  }

  async findByUsername(correo: string): Promise<UsuarioResponseDto | null> {
    const usuario = await this.repo.findOne({
      where: { correo },
      relations: ['sucursales'],
    });
    if (!usuario) return null;
    return UsuarioMapper.toDomain(usuario);
  }
}
