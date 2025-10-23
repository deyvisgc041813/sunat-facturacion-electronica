import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { ClienteOrmEntity } from '../cliente.orm.entity';
import { CronJobOrmEntity } from '../scheduler/cron_job.orm.entity';
import { SucursalOrmEntity } from '../sucursal.orm.entity';
import { EmpresaCredencialesOrmEntity } from './empesa-credenciales-sunat.orm.entity';
@Entity('empresas')
@Unique(['ruc', 'razonSocial'])
export class EmpresaOrmEntity {
  @PrimaryGeneratedColumn({ name: 'empresa_id' })
  empresaId: number;

  @Column({ name: 'ruc', type: 'varchar', length: 11, unique: true })
  ruc: string;

  @Column({ name: 'razon_social', type: 'varchar', length: 255 })
  razonSocial: string;

  @Column({
    name: 'nombre_comercial',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  nombreComercial?: string;

  @Column({ name: 'direccion', type: 'varchar', length: 255, nullable: true })
  direccion?: string;

  @Column({ name: 'estado', type: 'char', length: 1, default: '1' })
  estado: string;
  @Column({ type: 'varchar', length: 255 })
  logo: string;

  @Column({ type: 'varchar', name: 'logo_public_id', length: 100 })
  logoPublicId: string;

  @Column({ type: 'varchar', length: 45 })
  email: string;
  @Column({ type: 'varchar', length: 20 })
  telefono: string;

  @Column({ type: 'varchar', nullable: true })
  plan: string;

  // Relaciones
  @CreateDateColumn({
    name: 'create_at',
    type: 'datetime',
  })
  fechaRegistro: Date;

  @OneToMany(
    () => ClienteOrmEntity,
    (cliente: ClienteOrmEntity) => cliente.empresa,
  )
  clientes: ClienteOrmEntity[];

  @OneToMany(() => CronJobOrmEntity, (cronJob) => cronJob.empresa)
  cronJob: CronJobOrmEntity[];

  @OneToMany(() => SucursalOrmEntity, (sucursal) => sucursal.empresa)
  sucursales: SucursalOrmEntity[];
  @OneToMany(() => EmpresaCredencialesOrmEntity, (sucursal) => sucursal.empresa)
  credenciales: EmpresaCredencialesOrmEntity[];
}
