import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProvinciaOrmEntity } from './provincia.orm.entity copy';
import { SucursalOrmEntity } from '../sucursal/SucursalOrmEntity';

@Entity('distrito')
export class DistritoOrmEntity {
  @PrimaryGeneratedColumn({name: "distrito_id"})
  distritoId: number;
  @Column({ type: 'varchar', length: 150 })
  descripcion: string;
  @Column({type: 'varchar', length: 6 })
  ubigeo: string;
  @ManyToOne(() => ProvinciaOrmEntity, (pronvincia: ProvinciaOrmEntity) => pronvincia.distrito)
  @JoinColumn({name: 'provincia_id'})
  provincia:ProvinciaOrmEntity
  @OneToMany(() => SucursalOrmEntity, (sucursal) => sucursal.distrito)
  sucursales: SucursalOrmEntity[];
}
