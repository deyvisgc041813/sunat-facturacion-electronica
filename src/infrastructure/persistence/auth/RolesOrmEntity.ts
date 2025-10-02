import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';

@Entity('roles')
export class RolesOrmEntity {
@PrimaryGeneratedColumn({ name: 'role_id', type: 'int', unsigned: true })
  roleId: number;

  @Column({ unique: true })
  name: string;
}
