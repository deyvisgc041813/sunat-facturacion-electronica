import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProvinciaOrmEntity } from './provincia.orm.entity copy';

@Entity('departamento')
export class DepartamentoOrmEntity {
  @PrimaryGeneratedColumn({name: "departamento_id"})
  departamentoId: number;
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;
  @Column({type: 'varchar', length: 6 })
  ubigeo: string;
  @OneToMany(() => ProvinciaOrmEntity, (pronvincia) => pronvincia.departamento)
  pronvincia: ProvinciaOrmEntity[]
}

