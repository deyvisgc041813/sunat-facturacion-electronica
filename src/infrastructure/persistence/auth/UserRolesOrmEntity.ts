import { RolesOrmEntity } from './RolesOrmEntity';
import { UsuariosOrmEntity } from './UsuariosOrmEntity';
import { Entity, ManyToOne, JoinColumn, Column, PrimaryColumn } from 'typeorm';

@Entity('user_roles')
export class UserRolesOrmEntity {
  @PrimaryColumn({ name: 'usuario_id' })
  usuarioId: number;
  @PrimaryColumn({ name: 'role_id' })
  roleId: number;
  @ManyToOne(() => UsuariosOrmEntity, usuario => usuario.roles)
  @JoinColumn({ name: 'usuario_id' }) // Relación con la entidad Usuario
  usuario: UsuariosOrmEntity;

  @ManyToOne(() => RolesOrmEntity, role => role.users)
  @JoinColumn({ name: 'role_id' }) // Relación con la entidad Roles
  role: RolesOrmEntity;

}
