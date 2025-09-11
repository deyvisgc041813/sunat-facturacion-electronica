
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SerieOrmEntity } from './SerieOrmEntity';
import { UsuariosOrmEntity } from './UsuariosOrmEntity';

@Entity('series_auditoria')
export class SerieAuditoriaOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  serieAuditoriaId: number;
  
  @Column({ name: 'serie_id' })
  serieId: number;
  @Column({ name: 'usuario_id' })
  usuarioId: number;
  @Column({ name: "correlativo_anterior" })
  correlativoAnterior: number;
  @Column({ name: "correlativo_nuevo" })
  correlativoNuevo: number;
  @Column({ name: "motivo", type: 'varchar', length: 255 })
  motivo: string;
  @Column({ name: "fecha_cambio", type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fechaCambio: Date;
  @ManyToOne(() => SerieOrmEntity, (serie: SerieOrmEntity) => serie.auditorias)
  @JoinColumn({ name: 'serie_id' })
  serie: SerieOrmEntity;

  @ManyToOne(() => UsuariosOrmEntity, (usuario) => usuario.auditorias)
  @JoinColumn({ name: 'usuario_id' })
  usuario: UsuariosOrmEntity;
}
