
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sunat_logs')
export class SunatLogOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ name: 'comprobante_id', type: 'int', nullable: true })
  comprobanteId: number | null;
  @Column({ name: 'resumen_id', type: 'int', nullable: true })
  resumenId: number | null;
  @Column({ name: 'baja_id', type: 'int', nullable: true })
  bajaId: number | null;
  @Column({ name: 'sucursal_id', type: "int" })
  sucursalId: number;
  @CreateDateColumn({
    name: 'fecha_envio',
    type: 'datetime',
  })
  fechaEnvio: Date;

  @Column({ type: 'longtext', nullable: true })
  request: string;

  @Column({ type: 'longtext', nullable: true })
  response: string;
  @Column({ name: 'cod_respuesta_sunat', type: 'varchar', length: 50, nullable: true })
  codigoResSunat: string;
  @Column({ type: 'varchar', length: 20, nullable: true })
  estado: string;
  @Column({ type: 'varchar', length: 20, nullable: true })
  serie: string;
  @CreateDateColumn({
    name: 'fecha_respuesta',
    type: 'datetime',
    nullable: true
  })
  fechaRespuesta: Date;
  @Column({ name: "usuario_envio", type: 'varchar', length: 20, nullable: true })
  usuarioEnvio: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
  })
  createdAt: string;
  
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime'
  })
  updatedAt: string;
}
