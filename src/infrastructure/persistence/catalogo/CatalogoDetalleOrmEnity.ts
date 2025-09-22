import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CatalogoTipoOrmEnity } from './CatalogoTipoOrmEnity';

@Entity('catalogo_detalle')
export class CatalogoDetalleOrmEnity {
  @PrimaryGeneratedColumn({ name: 'catalogo_detalle_id' })
  id: number;

  @Column({ name: 'codigo', type: 'varchar', length: 10 })
  codigo: string;

  @Column({ type: 'varchar', length: 255 })
  descripcion: string;

  @Column({ name: 'catalogo_tipo_id' })
  catalogoId: number;

  @ManyToOne(() => CatalogoTipoOrmEnity, (tipo) => tipo.detalles,  { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'catalogo_tipo_id' })
  catalogo: CatalogoTipoOrmEnity;
}
