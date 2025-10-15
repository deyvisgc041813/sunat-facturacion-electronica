import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('user_sucursales')
export class UserSucursalesOrmEntity {
  // Definimos las columnas que componen la clave primaria compuesta
  @PrimaryColumn({ name: 'user_id' })
  usuarioId: number;

  @PrimaryColumn({ name: 'sucursal_id' })
  sucursalId: number;

}
