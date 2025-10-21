
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SerieAuditoriaOrmEntity } from './serie-auditoria.orm.entity';
import { ComprobanteOrmEntity } from '../comprobante/comprobante.orm.entity';

@Entity('series_comprobantes')
export class SerieOrmEntity {
  @PrimaryGeneratedColumn({ name: 'serie_comprobante_id' })
  serieId: number;
  @Column({ name: 'sucursal_id', type: "int" })
  sucursalId: number;
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

  @Column({ name: "usuario_registro", type: 'varchar', length: 50, nullable: true})
  usuarioRegistro: string;
  @Column({ name: "usuario_modificacion", type: 'varchar', length: 50, nullable: true})
  usuarioModificacion: string;
  @CreateDateColumn({ name: "fecha_registro",  type: 'timestamp' })
  fechaRegistro: Date;
  @UpdateDateColumn({ name: "fecha_modificacion",  type: 'timestamp' })
  fechaModificacion: Date;
  @OneToMany(() => SerieAuditoriaOrmEntity, (auditoria: SerieAuditoriaOrmEntity) => auditoria.serie)
  auditorias: SerieAuditoriaOrmEntity[];
  @OneToMany(() => ComprobanteOrmEntity, (comprobante: ComprobanteOrmEntity) => comprobante.serie)
  comprobantes: ComprobanteOrmEntity[];
}