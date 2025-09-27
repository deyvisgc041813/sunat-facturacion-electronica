import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CatalogoDetalleOrmEnity } from './CatalogoDetalleOrmEnity';

@Entity('catalogo_tipo')
export class CatalogoTipoOrmEnity {
  @PrimaryGeneratedColumn({ name: 'catalogo_tipo_id' })
  catalogoTipoId: number;

  @Column({ name: 'codigo_catalogo', type: 'varchar', length: 5, unique: true })
  codigoCatalogo: string;

  @Column({ type: 'varchar', length: 255 })
  descripcion: string;

  @OneToMany(() => CatalogoDetalleOrmEnity, (detalle) => detalle.catalogo)
  detalles: CatalogoDetalleOrmEnity[];
}
