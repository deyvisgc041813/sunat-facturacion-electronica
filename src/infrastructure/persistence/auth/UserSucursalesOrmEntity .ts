import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UsuariosOrmEntity } from './UsuariosOrmEntity';
import { SucursalOrmEntity } from '../sucursal/SucursalOrmEntity';

@Entity('user_sucursales')
export class UserSucursalesOrmEntity {
  // Definimos las columnas que componen la clave primaria compuesta
  @PrimaryColumn({ name: 'user_id' })
  usuarioId: number;

  @PrimaryColumn({ name: 'sucursal_id' })
  sucursalId: number;

  // // Relación con la entidad Usuario
  // @ManyToOne(() => UsuariosOrmEntity, usuario => usuario.sucursales)
  // @JoinColumn({ name: 'user_id' })  // Relación con la entidad Usuario
  // usuario: UsuariosOrmEntity;

  // // Relación con la entidad Sucursal
  // @ManyToOne(() => SucursalOrmEntity, sucursal => sucursal.usuarios)
  // @JoinColumn({ name: 'sucursal_id' })  // Relación con la entidad Sucursal
  // sucursal: SucursalOrmEntity;
}
