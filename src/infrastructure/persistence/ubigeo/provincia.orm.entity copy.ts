import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DepartamentoOrmEntity } from './departamento.orm.entity';
import { DistritoOrmEntity } from './distrito.orm.entity';

@Entity('provincia')
export class ProvinciaOrmEntity {
  @PrimaryGeneratedColumn({name: "provincia_id"})
  provinciaId: number;
  @Column({ type: 'varchar', length: 100 })
  descripcion: string;
  @Column({type: 'varchar', length: 6 })
  ubigeo: string;
  @ManyToOne(() => DepartamentoOrmEntity, (departamento: DepartamentoOrmEntity) => departamento.pronvincia)
  @JoinColumn({name: 'departamento_id'})
  departamento:DepartamentoOrmEntity
  @OneToMany(() => DistritoOrmEntity, (distrito) => distrito.provincia)
  distrito:DistritoOrmEntity[]
}