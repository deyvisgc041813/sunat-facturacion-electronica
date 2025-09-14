import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { EmpresaOrmEntity } from './EmpresaOrmEntity';
import { EstadoEnumComprobante } from 'src/util/estado.enum';
import { ClienteOrmEntity } from './ClienteOrmEntity';
import { SerieOrmEntity } from './SerieOrmEntity';
import { SunatLogOrmEntity } from './SunatLogOrmEntity';

@Entity('comprobantes')
export class ComprobanteOrmEntity {
  @PrimaryGeneratedColumn({ name: 'comprobante_id' })
  comprobanteId: number;

  @Column({ name: 'empresa_id' })
  empresaId: number;

  @Column({ name: 'cliente_id' })
  clienteId: number;

  @Column({ name: 'serie_id' })
  serieId: number;

  @Column({ name: 'numero_comprobante' })
  numeroComprobante: number;

  @Column({
    name: 'fecha_emision',
    type: 'datetime',
    nullable: false,
  })
  fechaEmision: Date;

  @Column({ name: 'moneda', type: 'varchar', length: 3, nullable: true })
  moneda?: string;

  @Column({
    name: 'mto_oper_gravadas',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  totalGravado?: number;

  @Column({
    name: 'mto_oper_exoneradas',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  totalExonerado?: number;

  @Column({
    name: 'mto_oper_inafectas',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  totalInafecto?: number;

  @Column({
    name: 'mto_igv',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  totalIgv?: number;

  @Column({
    name: 'mto_imp_venta',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  mtoImpVenta?: number;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoEnumComprobante,
    default: EstadoEnumComprobante.PENDIENTE,
  })
  estado: EstadoEnumComprobante;

  @Column({ name: 'xml', type: 'longtext', nullable: true })
  xmlFirmado?: string;
  @Column({ name: 'cdr', type: 'longtext', nullable: true })
  cdr?: string | null;

  @Column({ name: 'hash_cpe', type: 'varchar', length: 100 })
  hashCpe: string;

  @Column({ name: 'payload_json', type: 'longtext', nullable: true }) // aquí se guarda todo el JSON del comprobante (incluye detalles, leyendas, etc.)
  payloadJson?: string;
  @Column({ name: 'motivo_estado', type: 'longtext', nullable: true })
  motivoEstado?: string;

  @Column({
    name: 'fecha_creacion',
    type: 'datetime',
    nullable: false,
  })
  fechaCreate: Date;
  // @UpdateDateColumn({
  //   name: 'fecha_actualizacion',
  //   type: 'datetime',
  //   default: () => 'CURRENT_TIMESTAMP',
  //   onUpdate: 'CURRENT_TIMESTAMP',
  // })
  @Column({
    name: 'fecha_actualizacion',
    default: () => 'CURRENT_TIMESTAMP',
    type: 'datetime',
    nullable: false,
  })
  fechaUpdate: Date;
  // Relación con Empresa
  @ManyToOne(() => EmpresaOrmEntity, (empresa) => empresa.comprobantes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'empresa_id' })
  empresa: EmpresaOrmEntity;
  // Relación con Cliente
  @ManyToOne(() => ClienteOrmEntity, (cliente) => cliente.comprobantes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cliente_id' })
  cliente: ClienteOrmEntity;
  @ManyToOne(() => SerieOrmEntity, (serie) => serie.comprobantes, {
    onDelete: 'CASCADE',
  })
  serie: SerieOrmEntity;
  @OneToMany(
    () => SunatLogOrmEntity,
    (sunatLog: SunatLogOrmEntity) => sunatLog.comprobante,
  )
  sunatLogs: SunatLogOrmEntity[];
}
