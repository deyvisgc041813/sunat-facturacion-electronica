import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { SerieAuditoriaOrmEntity } from '../serie-log/SerieAuditoriaOrmEntity';
import { RolesOrmEntity } from './RolesOrmEntity';
import { SucursalOrmEntity } from '../sucursal/SucursalOrmEntity';
import { RefreshTokenOrmEntity } from './RefreshTokenOrmEntity';

@Entity('usuarios')
export class UsuariosOrmEntity {
  @PrimaryGeneratedColumn({ name: 'usuario_id' })
  usuarioId: number;
  @Column({ name: 'email', type: 'varchar', length: 50 })
  correo: string;
  @Column({ name: 'password', type: 'varchar', length: 50 })
  clave: string;
  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  nombre: string;
  @Column({ name: 'status', default: '1' })
  estado: string;
  @OneToMany(
    () => SerieAuditoriaOrmEntity,
    (auditoria: SerieAuditoriaOrmEntity) => auditoria.usuario,
  )
  auditorias: SerieAuditoriaOrmEntity[];

  @OneToMany(() => RefreshTokenOrmEntity, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshTokenOrmEntity[];
  // Relación muchos a muchos con roles
  @ManyToMany(() => RolesOrmEntity, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'usuarioId' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'roleId' },
  })
  roles: RolesOrmEntity[];
  @ManyToMany(() => SucursalOrmEntity, (sucursal) => sucursal.usuarios, {
    eager: true,
  })
  @JoinTable({
    name: 'user_sucursales',
    joinColumn: { name: 'user_id', referencedColumnName: 'usuarioId' },
    inverseJoinColumn: {
      name: 'sucursal_id',
      referencedColumnName: 'sucursalId',
    },
  })
  sucursales: SucursalOrmEntity[];
}
