import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  ManyToMany,
  OneToOne,
} from 'typeorm';
import { DistritoOrmEntity } from './ubigeo/distrito.orm.entity';
import { EEstadosGlobales } from 'src/util/estado.enum';
import { UsuariosOrmEntity } from '../../auth/usuario.orm.entity';
import { TenantConnectionOrmEntity } from './tenant.coneccion.orm.entity';
import { EmpresaOrmEntity } from './empresa/empesa.orm.entity';

@Entity({ name: 'sucursal' })
export class SucursalOrmEntity {
  @PrimaryGeneratedColumn({ name: 'sucursal_id', type: 'int', unsigned: true })
  sucursalId: number;

  @ManyToOne(() => EmpresaOrmEntity, (empresa) => empresa.sucursales, {
    eager: true,
  })
  @JoinColumn({ name: 'empresa_id' })
  empresa: EmpresaOrmEntity;
  @ManyToOne(
    () => DistritoOrmEntity,
    (distrito: DistritoOrmEntity) => distrito.sucursales,
    { eager: true },
  )
  @JoinColumn({ name: 'distrito_id' })
  distrito: DistritoOrmEntity;
  @ManyToMany(() => UsuariosOrmEntity, (user) => user.sucursales)
  usuarios: UsuariosOrmEntity[];

  @Column({ type: 'varchar', length: 30 })
  codigo: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 255 })
  direccion: string;

  @Column({ type: 'varchar', length: 6, nullable: true })
  ubigeo: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;
  @Column({ name: "sub_dominio", type: 'varchar', length: 255, nullable: true })
  subDominio: string;

  @Column({
    name: 'signature_id',
    type: 'varchar',
    length: 50,
    default: 'SIGN-DEFAULT',
  })
  signatureId: string;

  @Column({
    name: 'signature_note',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  signatureNote: string;

  @Column({ name: "estado", type: 'char', length: 1, 'default': EEstadosGlobales.PENDIENTE_ACTIVACION})
  estado: string;
  @Column({
    name: 'codigo_establecimiento_sunat',
    type: 'varchar',
    length: 4,
    default: '0000',
  })
  codigoEstablecimiento: string;
  @Column({ name: 'usuario_registro', type: 'varchar', length: 50 })
  usuarioRegistro: string;
  @Column({ name: 'usuario_modificacion', type: 'varchar', length: 50 })
  usuarioModificacion?: string;
  @Column({ name: 'entorno', type: 'varchar', length: 10, default: 'BETA' })
  entorno: string;
  @CreateDateColumn({ name: 'fecha_registro', type: 'timestamp' })
  fechaRegistro: Date;
  @CreateDateColumn({ name: 'fecha_modificacion', type: 'timestamp' })
  fechaModificacion: Date;
    /** Relación uno a uno con tenant_connections */
  @OneToOne(() => TenantConnectionOrmEntity, (tenant) => tenant.sucursal, {
    cascade: true,
    eager: true,
  })
  @JoinColumn({ name: 'sucursal_id' })
  tenantConnection: TenantConnectionOrmEntity;
}
