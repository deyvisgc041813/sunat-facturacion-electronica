import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('log_registro_respuesta_sunat')
export class LogRespuestaSunatOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'comprobante_id', type: 'int' })
  comprobanteId: number;

  @Column({ name: 'sucursal_id', type: 'int' })
  sucursalId: number;

  @Column({ name: 'estado', type: 'varchar', length: 20, nullable: true })
  estado: string | null;

  @Column({ name: 'descripcion_estado', type: 'varchar', length: 255, nullable: true })
  descripcionEstado: string | null;

  @Column({ name: 'cdr', type: 'longtext', nullable: true })
  cdr: Buffer | null;

  @Column({ name: 'xml_firmado', type: 'longtext', nullable: true })
  xmlFirmado: string | null;

  @Column({ name: 'hash_cpe', type: 'varchar', length: 255, nullable: true })
  hashCpe: string | null;

  @Column({ name: 'error_mensaje', type: 'text', nullable: true })
  errorMensaje: string | null;

  @CreateDateColumn({ name: 'fecha_error', type: "datetime" })
  fechaError: Date;
}
