import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Unique } from 'typeorm';
import { ClienteOrmEntity } from '../cliente/ClienteOrmEntity';
import { SucursalOrmEntity } from '../sucursal/SucursalOrmEntity';

@Entity('empresas')
@Unique(['ruc', 'razonSocial'])
export class EmpresaOrmEntity {
  @PrimaryGeneratedColumn({ name: 'empresa_id' })
  empresaId: number;

  @Column({ name: "ruc", type: 'varchar', length: 11, unique: true })
  ruc: string;

  @Column({ name: "razon_social", type: 'varchar', length: 255 })
  razonSocial: string;

  @Column({ name: "nombre_comercial", type: 'varchar', length: 255, nullable: true })
  nombreComercial?: string;

  @Column({ name: "direccion", type: 'varchar', length: 255, nullable: true })
  direccion?: string;

  @Column({ name: "certificado_digital", type: 'longblob', nullable: true })
  certificadoDigital?: Buffer;

  @Column({ name: "clave_certificado", type: 'varchar', length: 100, nullable: true })
  claveCertificado?: string;

  @Column({ name: "usuario_sol_secundario", type: 'varchar', length: 50, nullable: true })
  usuarioSolSecundario?: string;

  @Column({ name: "clave_sol_secundario", type: 'varchar', length: 50, nullable: true })
  claveSolSecundario?: string;

  @Column({ name: "modo", type: 'varchar', length: 10, default: 'BETA' })
  modo: string;

  @Column({ name: "estado", type: 'tinyint', default: 1 })
  estado: number;
  @Column({ type: 'varchar', length: 255})
  logo: string;
  @Column({ type: 'varchar', length: 45})
  email: string;
  @Column({ type: 'varchar', length: 20})
  telefono:string
  // Relaciones
  @OneToMany(() => ClienteOrmEntity, (cliente: ClienteOrmEntity) => cliente.empresa)
  clientes: ClienteOrmEntity[];
  @OneToMany(() => SucursalOrmEntity, (sucursal) => sucursal.empresa)
  sucursales: SucursalOrmEntity[];
}
