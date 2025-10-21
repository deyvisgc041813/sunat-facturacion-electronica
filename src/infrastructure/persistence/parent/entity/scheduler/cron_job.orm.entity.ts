import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EmpresaOrmEntity } from '../empesa.orm.entity';
import { EEstadosCronJob } from 'src/util/estado.enum';

@Entity('cron_jobs')
export class CronJobOrmEntity {
  @PrimaryGeneratedColumn({ name: 'cron_id' })
  cronId: number;
  @Column({ name: 'tipo', type: 'varchar', length: 150 })
  tipo: string;

  @Column({ name: 'hora_ejecucion', type: 'varchar', length: 5 })
  horaEjecucion: string; // Ejemplo: "05:00"

  @Column({ name: 'proxima_ejecucion', type: 'timestamp' })
  proximaEjecucion: Date;

  @Column({ name: 'repetir', type: 'tinyint', default: true })
  repetir: string;

  @Column({ name: 'estado', type: 'varchar', length: 5, default: EEstadosCronJob.PROGRAMADO})
  estado: string;

  @Column({ name: 'payload', type: 'json', default: {} })
  payload: Record<string, any>;

  @Column({ name: 'ultima_ejecucion', type: 'timestamp', nullable: true })
  ultimaEjecucion?: Date;
  @Column({ name: 'messaje_error', type: 'text', nullable: true})
  messageError: string;
  @ManyToOne(() => EmpresaOrmEntity, (empresa: EmpresaOrmEntity) => empresa.cronJob, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: EmpresaOrmEntity;
}
