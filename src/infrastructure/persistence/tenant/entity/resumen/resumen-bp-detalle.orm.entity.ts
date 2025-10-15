import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ResumenBoletasOrmEntity } from './resumen-bp.orm.entity';
import { ComprobanteOrmEntity } from '../comprobante/comprobante.orm.entity';

@Entity({ name: 'resumen_boletas_detalle' })
export class ResumenBoletasDetalleOrmEntity {
  @PrimaryGeneratedColumn({ name: 'res_bol_det_id' })
  resBolDetId: number;

  @ManyToOne(() => ResumenBoletasOrmEntity, (resumen) => resumen.detalles, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'resumen_id' })
  resumen: ResumenBoletasOrmEntity;

  @ManyToOne(() => ComprobanteOrmEntity, (comprobante) => comprobante.resumenesDetalle)
  @JoinColumn({ name: 'comprobante_id' })
  comprobante: ComprobanteOrmEntity;

  @Column({ type: 'varchar', length: 10 })
  operacion: string; // 1 = vigente, 3 = anulado
}
