
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SucursalOrmEntity } from '../sucursal/SucursalOrmEntity';

@Entity('productos')
export class ProductoOrmEntity {
  @PrimaryGeneratedColumn({ name: 'producto_id' })
  productoId: number;

  @Column({ name: "codigo", type: 'varchar', length: 10 })
  codigo: string;

  @Column({ name: "descripcion", type: 'varchar', length: 15 })
  descripcion: string;

  @Column({ name: "unidad_medida", type: 'varchar', length: 255 })
  unidadMedida: string;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 12, scale: 2 })
  precioUnitario: number;

  @Column({ name: "afecta_igv",  type: 'tinyint', default: 1})
  afectaIgv?: number;

  @Column({ name: "estado", type: 'tinyint', default: 1 })
  estado: number;

  @ManyToOne(() => SucursalOrmEntity, (sucursal: SucursalOrmEntity) => sucursal.productos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: SucursalOrmEntity;
}
