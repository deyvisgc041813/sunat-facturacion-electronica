import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BajaComprobanteOrmEntity } from './BajaComprobanteOrmEntity';
import { ComprobanteOrmEntity } from '../comprobante/ComprobanteOrmEntity';

@Entity({ name: 'baja_comprobante_detalle' })
export class BajaComprobanteDetalleOrmEntity {
  @PrimaryGeneratedColumn({ name: 'baja_comprobante_detalle_id' })
  bajaComprobanteDetalleId: number;

  @Column({ name: 'motivo', type: 'varchar', length: 255, nullable: true })
  motivo?: string;

  // 🔹 Relación con la tabla padre "baja_comprobante"
  @ManyToOne(() => BajaComprobanteOrmEntity, (baja) => baja.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'baja_id' })
  baja: BajaComprobanteOrmEntity;

  @ManyToOne(() => ComprobanteOrmEntity, (comprobante) => comprobante.bajaDetalle)
  @JoinColumn({ name: 'comprobante_id' })
  comprobante: ComprobanteOrmEntity;
}
