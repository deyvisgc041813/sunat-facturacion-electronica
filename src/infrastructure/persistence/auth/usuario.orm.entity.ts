import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { SucursalOrmEntity } from 'src/infrastructure/persistence/parent/entity/sucursal.orm.entity';
import { SerieAuditoriaOrmEntity } from 'src/infrastructure/persistence/tenant/entity/serie-comprobante/serie-auditoria.orm.entity';
import { RefreshTokenOrmEntity } from './refresh-token.orm.entity';
import { RolesOrmEntity } from './role.orm.entity';

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
  @Column({ name: 'branch_selection_date', type: 'date' })
  fecSelecSucursal?: Date;
  @Column({ name: 'branch_asset_id', type: 'int' })
  sucursalActiva?: number;

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
