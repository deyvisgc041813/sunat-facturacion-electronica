import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { SerieOrmEntity } from './serie-comprobante.orm.entity';
@Entity('series_auditoria')
export class SerieAuditoriaOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  serieAuditoriaId: number;
  @Column({ name: 'usuario_id', nullable: true})
  usuarioId: number;
  @Column({ name: 'sucursal_id', nullable:true })
  sucursalId: number;
  @Column({ name: 'correlativo_anterior' })
  correlativoAnterior: number;
  @Column({ name: 'correlativo_nuevo' })
  correlativoNuevo: number;
  @Column({ name: 'motivo', type: 'varchar', length: 255 })
  motivo: string;
  @CreateDateColumn({
    name: 'fecha_cambio',
    type: 'datetime',
  })
  fechaCambio: Date;
  @ManyToOne(() => SerieOrmEntity, (serie: SerieOrmEntity) => serie.auditorias)
  @JoinColumn({ name: 'serie_comprobante_id' })
  serie: SerieOrmEntity;
}
