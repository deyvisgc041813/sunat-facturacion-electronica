import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EmpresaOrmEntity } from './EmpresaOrmEntity';
import { EstadoEnumComprobante } from 'src/util/estado.enum';
import { ClienteOrmEntity } from './ClienteOrmEntity';
import { SerieOrmEntity } from './SerieOrmEntity';

@Entity('comprobante')
export class ComprobanteOrmEntity {
  @PrimaryGeneratedColumn({ name: 'comprobante_id' })
  comprobanteId: number;

  @Column({ name: 'empresa_id' })
  empresaId: number;

  @Column({ name: 'cliente_id' })
  clienteId: number;

  @Column({ name: 'serie_id' })
  serieId: number;

  @Column({ name: 'numero_comprobante' })
  numeroComprobante: number;

  @Column({
    name: 'fecha_emision',
    type: 'datetime',
    nullable: false,
  })
  fechaEmision: Date;

  @Column({ name: 'moneda', type: 'varchar', length: 3, nullable: true })
  moneda?: string;

  @Column({ name: 'total_gravado', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalGravado?: number;

  @Column({ name: 'total_exonerado', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalExonerado?: number;

  @Column({ name: 'total_inafecto', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalInafecto?: number;

  @Column({ name: 'total_igv', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalIgv?: number;

  @Column({ name: 'total', type: 'decimal', precision: 12, scale: 2, nullable: true })
  total?: number;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoEnumComprobante,
    default: EstadoEnumComprobante.PENDIENTE,
  })
  estado: EstadoEnumComprobante;

  @Column({ name: 'xml', type: 'longtext', nullable: true })
  xmlFirmado?: string;

  @Column({ name: 'cdr', type: 'longblob', nullable: true })
  cdr?: Buffer;

  @Column({ name: 'hash_cpe', type: 'varchar', length: 100 })
  hashCpe: string;

  @Column({ name: 'payload_json', type: 'longtext', nullable: true })    // aquí se guarda todo el JSON del comprobante (incluye detalles, leyendas, etc.)
  payloadJson?: string;
  @Column({ name: 'motivo_estado', type: 'varchar', length: 200, nullable: true })
  motivoEstado?: string;

  // Relación con Empresa
  @ManyToOne(() => EmpresaOrmEntity, empresa => empresa.comprobantes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: EmpresaOrmEntity;
  // Relación con Cliente
  @ManyToOne(() => ClienteOrmEntity, cliente => cliente.comprobantes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cliente_id' })
  cliente: ClienteOrmEntity;
  @ManyToOne(() => SerieOrmEntity, serie  => serie.comprobantes, {onDelete: 'CASCADE'})
  serie: SerieOrmEntity
}
