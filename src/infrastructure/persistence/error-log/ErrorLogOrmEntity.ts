import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('error_logs')
export class ErrorLogOrmEntity {
  @PrimaryGeneratedColumn({ name: "id", type: 'bigint' })
  errorId: number; // identificador único

  @Column({ name: "tipo_comprobante", type: 'varchar', length: 2 })
  tipoComprobante: string; // 01 factura, 03 boleta, etc.

  @Column({ name: "serie", type: 'varchar', length: 4 })
  serie: string; // serie del comprobante (ej: B001)

  @Column({ name: "correlativo", type: 'varchar', length: 20})
  correlativo: string; // correlativo del comprobante (ej: 1)

  @Column({ name: "origen",  type: 'varchar', length: 50 })
  origen: string; // SUNAT | SISTEMA

  @Column({ name: "codigo_error", type: 'varchar', length: 100, nullable: true })
  codigoError: string; // faultcode o código interno

  @Column({ name: "mensaje_error", type: 'varchar', length: 500 })
  mensajeError: string; // faultstring o mensaje

  @Column({ name: "detalle_error", type: 'text', nullable: true })
  detalleError: any; // detalle extendido o JSON

  @Column({name: "estado", type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado: string; // PENDIENTE, REINTENTADO, SOLUCIONADO

  @CreateDateColumn({ name: "fecha_creacion",  type: 'timestamp' })
  fechaCreacion: Date; // fecha del error
}
