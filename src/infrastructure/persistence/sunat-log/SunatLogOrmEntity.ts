import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ComprobanteOrmEntity } from '../comprobante/ComprobanteOrmEntity';
import { ResumenBoletasOrmEntity } from '../resumen/ResumenBoletasOrmEntity';

@Entity('sunat_logs')
export class SunatLogOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'comprobante_id', type: 'int' })
  comprobanteId: number | null;

  // @ManyToOne(() => ComprobanteOrmEntity, (c) => c.sunatLogs, {
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn({ name: 'comprobante_id' })

  // @ManyToOne(() => ResumenBoletasOrmEntity, (c) => c.sunatResLogs, {
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn({ name: 'resumen_id' })
  
  @Column({ name: 'resumen_id', type: 'int' })
  resumenId: number | null;

  @CreateDateColumn({
    name: 'fecha_envio',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaEnvio: Date;

  @Column({ type: 'longtext', nullable: true })
  request: string;

  @Column({ type: 'longtext', nullable: true })
  response: string;
  @Column({ name: 'cod_resumen_sunat', type: 'varchar', length: 50 })
  codigoResumenSunat: string;
  @Column({ type: 'varchar', length: 20, nullable: true })
  estado: string;
}
