
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { EmpresaOrmEntity } from './EmpresaOrmEntity';
import { SerieAuditoriaOrmEntity } from './SerieAuditoriaOrmEntity';

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

  @Column({ name: "correlativo_inicial", type: 'varchar', length: 255 })
  correlativoInicial?: number;

  // Relación con Empresa
  @ManyToOne(() => EmpresaOrmEntity, (empresa: EmpresaOrmEntity) => empresa.clientes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: EmpresaOrmEntity;
  @OneToMany(() => SerieAuditoriaOrmEntity, (auditoria: SerieAuditoriaOrmEntity) => auditoria.serie)
  auditorias: SerieAuditoriaOrmEntity[];
}