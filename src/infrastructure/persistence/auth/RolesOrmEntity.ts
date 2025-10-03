import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany } from 'typeorm';
import { UserRolesOrmEntity } from './UserRolesOrmEntity';

@Entity('roles')
export class RolesOrmEntity {
@PrimaryGeneratedColumn({ name: 'role_id', type: 'int', unsigned: true })
  roleId: number;

  @Column({ unique: true })
  name: string;
    // Relación inversa con UserRolesOrmEntity
  @OneToMany(() => UserRolesOrmEntity, userRole => userRole.role)
  users: UserRolesOrmEntity[];  // Relación inversa, esto representa los usuarios con ese rol
}
