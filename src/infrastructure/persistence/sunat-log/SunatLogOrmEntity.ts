import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EmpresaOrmEntity } from '../empresa/EmpresaOrmEntity';

@Entity('sunat_logs')
export class SunatLogOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'comprobante_id', type: 'int' })
  comprobanteId: number | null;
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
  @Column({ name: 'cod_respuesta_sunat', type: 'varchar', length: 50 })
  codigoResSunat: string;
  @Column({ type: 'varchar', length: 20, nullable: true })
  estado: string;
  @Column({ type: 'varchar', length: 20, nullable: true })
  serie: string;
  @ManyToOne(() => EmpresaOrmEntity, (empresa) => empresa.sunatLog)
  @JoinColumn({ name: 'empresa_id' })
  empresa: EmpresaOrmEntity;
}
