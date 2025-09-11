
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { SerieAuditoriaOrmEntity } from './SerieAuditoriaOrmEntity';

@Entity('usuarios')
export class UsuariosOrmEntity {
  @PrimaryGeneratedColumn({ name: 'usuario_id' })
  usuarioId: number;

  @Column({ name: 'username', type: 'varchar', length: 50 })
  usuario: string;

  @Column({ name: "password", type: 'varchar', length: 50 })
  clave: string;
  @OneToMany(() => SerieAuditoriaOrmEntity, (auditoria: SerieAuditoriaOrmEntity) => auditoria.usuario)
  auditorias: SerieAuditoriaOrmEntity[];
}