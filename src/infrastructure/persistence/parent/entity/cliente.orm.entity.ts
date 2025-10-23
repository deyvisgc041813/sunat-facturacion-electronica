import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EmpresaOrmEntity } from './empresa/empesa.orm.entity';

@Entity('clientes')
export class ClienteOrmEntity {
  @PrimaryGeneratedColumn({ name: 'cliente_id' })
  clienteId: number;

  @Column({ name: 'empresa_id' })
  empresaId: number;

  @Column({ name: "tipo_documento", type: 'varchar', length: 2 })
  tipoDocumento: string;

  @Column({ name: "numero_documento", type: 'varchar', length: 15 })
  numeroDocumento: string;

  @Column({ name: "razon_social", type: 'varchar', length: 255 })
  razonSocial?: string;

  @Column({ name: "direccion", type: 'varchar', length: 255, nullable: true })
  direccion?: string;

  @Column({ name: "correo",  type: 'varchar', length: 150, nullable: true })
  correo?: string;

  @Column({name: "telefono",  type: 'varchar', length: 50, nullable: true })
  telefono?: string;

  @Column({ name: "estado", type: 'tinyint', default: "1" })
  estado: string;
  @Column({name: "nombre",  type: 'varchar', length: 100 })
  nombre?: string;
  @Column({ type: "varchar", length: 50})
  distrito: string;
  @Column({ type: "varchar", length: 50})
  provincia: string;
  @Column({ type: "varchar", length: 50})
  departamento: string;
  @Column({name: "estado_contribuyente",  type: 'varchar', length: 45 })
  estadoComtribuyente?: string;
  @Column({name: "condicion_domicilio",  type: 'varchar', length: 45 })
  condicionDomicilio?: string;

  @ManyToOne(() => EmpresaOrmEntity, (empresa: EmpresaOrmEntity) => empresa.clientes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: EmpresaOrmEntity;
}
