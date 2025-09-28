
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ComprobanteOrmEntity } from '../../persistence/comprobante/ComprobanteOrmEntity';
import { SerieAuditoriaOrmEntity } from '../serie-log/SerieAuditoriaOrmEntity';
import { SucursalOrmEntity } from '../sucursal/SucursalOrmEntity';

@Entity('series_comprobantes')
export class SerieOrmEntity {
  @PrimaryGeneratedColumn({ name: 'serie_comprobante_id' })
  serieId: number;

  @Column({ name: "tipo_comprobante", type: 'varchar', length: 2 })
  tipoComprobante: string;

  @Column({ name: "serie", type: 'varchar', length: 4 })
  serie: string;

  @Column({ name: "correlativo_inicial"})
  correlativoInicial?: number;
  @Column({ name: "correlativo_actual", default: 0 })
  correlativoActual?: number;
  @Column({ name: "estado", type: 'char', length: 1, 'default': "1" })
  estado: string;
  @CreateDateColumn({ name: "fecha_creacion",  type: 'timestamp' })
  fechaCreacion: Date;
  @UpdateDateColumn({ name: "fecha_actualizacion",  type: 'timestamp' })
  fechaActualizacion: Date;

  @ManyToOne(() => SucursalOrmEntity, (sucursal: SucursalOrmEntity) => sucursal.series, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: SucursalOrmEntity;
  @OneToMany(() => SerieAuditoriaOrmEntity, (auditoria: SerieAuditoriaOrmEntity) => auditoria.serie)
  auditorias: SerieAuditoriaOrmEntity[];
  @OneToMany(() => ComprobanteOrmEntity, (comprobante: ComprobanteOrmEntity) => comprobante.serie)
  comprobantes: ComprobanteOrmEntity[];
}