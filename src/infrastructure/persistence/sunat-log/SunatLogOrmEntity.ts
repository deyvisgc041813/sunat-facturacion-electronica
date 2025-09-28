import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SucursalOrmEntity } from '../sucursal/SucursalOrmEntity';

@Entity('sunat_logs')
export class SunatLogOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'comprobante_id', type: 'int' })
  comprobanteId: number | null;
  @Column({ name: 'resumen_id', type: 'int' })
  resumenId: number | null;
  @Column({ name: 'baja_id', type: 'int' })
  bajaId: number | null;
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
  @Column({ type: 'int'})
  intento: number;
  @CreateDateColumn({
    name: 'fecha_respuesta',
    type: 'datetime'
  })
  fechaRespuesta: Date;
  @Column({ name: "usuario_envio", type: 'varchar', length: 20, nullable: true })
  usuarioEnvio: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: string;
  
  @CreateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: string;

  @ManyToOne(() => SucursalOrmEntity, (sucursal: SucursalOrmEntity) => sucursal.sunatLog)
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: SucursalOrmEntity;
}
