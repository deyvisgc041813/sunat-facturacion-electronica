import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CatalogoTipoOrmEnity } from './CatalogoTipoOrmEnity';

@Entity('catalogo_detalle')
export class CatalogoDetalleOrmEnity {
  @PrimaryGeneratedColumn({ name: 'catalogo_detalle_id' })
  detalleCatalogoId: number;
  @Column({ name: 'codigo', type: 'varchar', length: 10 })
  codigo: string;

  @Column({ type: 'varchar', length: 255 })
  descripcion: string;
  @Column({ type: 'varchar', length: 255 })
  nombre: string;
  @Column({name: "codigo_internacional", type: 'varchar', length: 10 })
  codigoInternacional: string;
  @Column({name: "tipo_comprobante_asociado", type: 'varchar', length: 10 })
  tipoComprobanteAsociado: string;
  @Column({name: "tipo_afectacion", type: 'varchar', length: 20 })
  tipoAfectacion: string;

  @ManyToOne(() => CatalogoTipoOrmEnity, (tipo) => tipo.detalles,  { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'catalogo_tipo_id' })
  catalogo: CatalogoTipoOrmEnity;
}