import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  EstadoComunicacionEnvioSunat,
  EstadoEnumComprobante,
} from 'src/util/estado.enum';
import { ResumenBoletasDetalleOrmEntity } from 'src/infrastructure/persistence/tenant/entity/resumen/resumen-bp-detalle.orm.entity';
import { ComprobanteRespuestaSunatOrmEntity } from './conprobante-respuesta-sunat.orm.entity';
import { SerieOrmEntity } from '../serie-comprobante/serie-comprobante.orm.entity';
import { BajaComprobanteDetalleOrmEntity } from '../comunicacion-baja/baja-comunicacion-detalle.orm.entity';

@Entity('comprobantes')
export class ComprobanteOrmEntity {
  @PrimaryGeneratedColumn({ name: 'comprobante_id' })
  comprobanteId: number;
  @Column({ name: 'sucursal_id', type: "int" })
  sucursalId: number;
  @Column({ name: 'cliente_id',  type: "int"})
  clienteId: number;

  @Column({ name: 'numero_comprobante' })
  numeroComprobante: number;
  @Column({
    name: 'fecha_emision',
    type: 'datetime',
    nullable: false,
  })
  fechaEmision: Date;

  @Column({
    name: 'fecha_vencimiento',
    //default: () => 'CURRENT_TIMESTAMP',
    type: 'datetime',
    nullable: false,
  })
  fechaVencimiento: Date;

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
    name: 'icbper',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  icbper?: number;
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

  @Column({ name: 'payload_json', type: 'longtext', nullable: true }) // aquí se guarda todo el JSON del comprobante (incluye detalles, leyendas, etc.)
  payloadJson?: string;
  @Column({ name: 'descripcion_estado', type: 'text', nullable: true })
  descripcionEstado?: string;
  @Column({
    name: 'comunicado_sunat',
    type: 'tinyint',
    nullable: true,
    default: false,
  })
  comunicadoSunat?: EstadoComunicacionEnvioSunat;
  @Column({
    name: 'serie_correlativo',
    type: 'varchar',
    length: 20,
    nullable: true,
    default: false,
  })
  serieCorrelativo?: string;

  @CreateDateColumn({
    name: 'fecha_registro',
    type: 'datetime',
  })
  fechaCreate: Date;
  @UpdateDateColumn({
    name: 'fecha_modificacion', 
    type: 'datetime',
    nullable: false,
  })
  fechaUpdate: Date;
  @CreateDateColumn({
    name: 'fecha_anulacion',
    type: 'datetime',
    nullable: true,
  })
  fechaAnulacion: Date | null;

  @JoinColumn({ name: 'serie_comprobante_id' })
  @ManyToOne(() => SerieOrmEntity, (serie) => serie.comprobantes, {
    onDelete: 'CASCADE',
  })
  serie: SerieOrmEntity;

  @OneToMany(
    () => ResumenBoletasDetalleOrmEntity,
    (detalle) => detalle.comprobante,
  )
  resumenesDetalle: ResumenBoletasDetalleOrmEntity[];
  @OneToMany(
    () => BajaComprobanteDetalleOrmEntity,
    (detalle) => detalle.comprobante,
  )
  bajaDetalle: BajaComprobanteDetalleOrmEntity[];

  @OneToOne(
    () => ComprobanteRespuestaSunatOrmEntity,
    (respuestaSunat) => respuestaSunat.comprobante,
  )
  respuestaSunat: ComprobanteRespuestaSunatOrmEntity;
}
