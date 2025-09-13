
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { EmpresaOrmEntity } from './EmpresaOrmEntity';
import { SerieAuditoriaOrmEntity } from './SerieAuditoriaOrmEntity';
import { ComprobanteOrmEntity } from './ComprobanteOrmEntity';

@Entity('series')
export class SerieOrmEntity {
  @PrimaryGeneratedColumn({ name: 'serie_id' })
  serieId: number;

  @Column({ name: 'empresa_id' })
  empresaId: number;

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
  // Relación con Empresa
  @ManyToOne(() => EmpresaOrmEntity, (empresa: EmpresaOrmEntity) => empresa.clientes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: EmpresaOrmEntity;
  @OneToMany(() => SerieAuditoriaOrmEntity, (auditoria: SerieAuditoriaOrmEntity) => auditoria.serie)
  auditorias: SerieAuditoriaOrmEntity[];
  @OneToMany(() => ComprobanteOrmEntity, (comprobante: ComprobanteOrmEntity) => comprobante.serie)
  comprobantes: ComprobanteOrmEntity[];
}