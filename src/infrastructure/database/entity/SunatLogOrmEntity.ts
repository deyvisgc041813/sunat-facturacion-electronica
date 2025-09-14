import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ComprobanteOrmEntity } from './ComprobanteOrmEntity';

@Entity('sunat_logs')
export class SunatLogOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'comprobante_id', type: 'int' })
  comprobanteId: number;

  @ManyToOne(() => ComprobanteOrmEntity, (c) => c.sunatLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comprobante_id' })
  comprobante: ComprobanteOrmEntity;

  @CreateDateColumn({ name: 'fecha_envio', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fechaEnvio: Date;

  @Column({ type: 'longtext', nullable: true })
  request: string;

  @Column({ type: 'longtext', nullable: true })
  response: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  estado: string;
}
