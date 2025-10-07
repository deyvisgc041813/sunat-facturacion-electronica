import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('auditoria_logs')
export class AuditoriaLogOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_log' })
  logId: number;

  @Column({ name: 'tabla_afectada', length: 100 })
  tablaAfectada: string;

  @Column({ name: 'id_registro', nullable: true })
  registroId?: number;

  @Column({ name: 'accion', length: 50 })
  accion: string; // Ejemplo: INSERT, UPDATE, DELETE, ANULACION

  @Column({ name: 'valores_anteriores', type: 'json', nullable: true })
  valoresAnteriores?: any;

  @Column({ name: 'valores_nuevos', type: 'json', nullable: true })
  valoresNuevos?: any;

  @Column({ name: 'usuario_id', type: 'bigint' })
  usuarioId: number;
  @Column({ name: 'sucursal_id', type: 'bigint' })
  sucursalId: number;
  @Column({ name: 'nombre_usuario', length: 150, nullable: true })
  nombreUsuario?: string;

  @Column({ name: 'entorno', length: 20, nullable: true })
  entorno?: string;

  @CreateDateColumn({ name: 'fecha_accion', type: 'timestamp' })
  fechaAccion: Date;

  @Column({ name: 'observacion', length: 255, nullable: true })
  observacion?: string;

  @Column({ name: 'aplicacion_origen', length: 100, nullable: true })
  aplicacionOrigen?: string;
}
