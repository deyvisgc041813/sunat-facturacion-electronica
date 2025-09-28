import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BajaComprobanteDetalleOrmEntity } from './BajaComprobanteDetalleOrmEntity';
import { SucursalOrmEntity } from '../sucursal/SucursalOrmEntity';
@Entity({ name: 'baja_comprobante' })
export class BajaComprobanteOrmEntity {
  @PrimaryGeneratedColumn({ name: 'baja_comprobante_id' })
  bajaComprobanteId: number;

  @Column({ name: 'fecha_generacion', type: 'date' })
  fechaGeneracion: Date;

  @Column({ name: 'fec_referencia', type: 'date' })
  fecReferencia: Date;

  @Column({ name: 'correlativo', type: 'int' })
  correlativo: number;

  @Column({ name: 'nombre_archivo', type: 'varchar', length: 100 })
  nombreArchivo: string;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado: string;

  @Column({ name: 'xml', type: 'longtext', nullable: true })
  xml: string;

  @Column({ type: 'varchar', length: 20 })
  serie: string;

  @Column({ name: 'ticket', type: 'varchar', length: 20, nullable: true })
  ticket: string;

  @Column({ name: 'cdr', type: 'longtext', nullable: true })
  cdr?: string;

  @Column({
    name: 'hash_comunicacion',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  hashComunicacion?: string;
  @Column({ name: 'fecha_recepcion_sunat', type: 'date' })
  fechaRespuestaSunat: Date;
  @Column({ name: 'codigo_respuesta_sunat', type: 'varchar', length: 5 })
  codResPuestaSunat: string;
  @Column({ name: 'mensaje_sunat', type: 'varchar', length: 250 })
  mensajeSunat: string;
  @Column({ name: 'observaciones_sunat', type: 'longtext', nullable: true })
  observacionSunat?: string;

  @ManyToOne(() => SucursalOrmEntity, (sucursal: SucursalOrmEntity) => sucursal.comunicacionBaja)
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: SucursalOrmEntity;

  // 🔹 Relación con detalles
  @OneToMany(() => BajaComprobanteDetalleOrmEntity, (detalle) => detalle.baja, {
    cascade: true,
  })
  detalles: BajaComprobanteDetalleOrmEntity[];
}
