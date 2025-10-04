import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { ClienteOrmEntity } from '../cliente/ClienteOrmEntity';
import { SucursalOrmEntity } from '../sucursal/SucursalOrmEntity';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata.js';

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

  @Column({ name: 'certificado_digital', type: 'longblob', nullable: true })
  certificadoDigital?: Buffer;

  @Column({
    name: 'clave_certificado',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  claveCertificado?: string;

  @Column({
    name: 'usuario_sol_secundario',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  usuarioSolSecundario?: string;

  @Column({
    name: 'clave_sol_secundario',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  claveSolSecundario?: string;

  @Column({ name: 'modo', type: 'varchar', length: 10, default: 'BETA' })
  modo: string;

  @Column({ name: 'estado', type: 'tinyint', default: 1 })
  estado: number;
  @Column({ type: 'varchar', length: 255 })
  logo: string;
  @Column({ type: 'varchar', name: 'logo_public_id', length: 100 })
  logoPublicId: string;

  @Column({ type: 'varchar', length: 45 })
  email: string;
  @Column({ type: 'varchar', length: 20 })
  telefono: string;

  // Nombre del archivo certificado (.pfx o .pem)
  @Column({
    name: 'certificado_nombre',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  certificadoNombreArchivo: string;

  // Hash SHA256 del certificado
  @Column({
    name: 'certificado_hash',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  certificadoHash: string;

  // Titular del certificado (subject CN)
  @Column({
    name: 'certificado_subject',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  certificadoSubject: string;

  // Emisor del certificado (issuer CN)
  @Column({
    name: 'certificado_issuer',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  certificadoIssuer: string;

  // Fecha desde la que es válido
  @Column({ name: 'certificado_valido_desde', type: 'date', nullable: true })
  certificadoValidoDesde: Date;

  // Fecha hasta la que es válido
  @Column({ name: 'certificado_valido_hasta', type: 'date', nullable: true })
  certificadoValidoHasta: Date;
  @Column({ name: 'certificado_public_id', type: 'date', nullable: true })
  certificadoPublicId: string;

  
  // Relaciones
  @CreateDateColumn({
    name: 'create_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaRegistro: Date;

  @OneToMany(
    () => ClienteOrmEntity,
    (cliente: ClienteOrmEntity) => cliente.empresa,
  )
  clientes: ClienteOrmEntity[];
  @OneToMany(() => SucursalOrmEntity, (sucursal) => sucursal.empresa)
  sucursales: SucursalOrmEntity[];
}
