import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tributo_tasa')
export class TributoTasaOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'codigo_sunat', type: 'varchar', length: 10 })
  codigoSunat: string; // Ej: 1000, 2000, 6030

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  nombre: string; // Ej: IGV, ISC, ICBPER

  @Column({ name: 'tasa', type: 'decimal', precision: 10, scale: 4, nullable: true })
  tasa?: number; // % para IGV, ISC

  @Column({ name: 'monto', type: 'decimal', precision: 10, scale: 4, nullable: true })
  monto?: number; // Monto fijo (ICBPER)

  @Column({ name: 'moneda', type: 'char', length: 3, default: 'PEN' })
  moneda: string;

  @Column({ name: 'vigencia_desde', type: 'date' })
  vigenciaDesde: Date;

  @Column({ name: 'vigencia_hasta', type: 'date', nullable: true })
  vigenciaHasta?: Date;

  @Column({ name: 'observacion', type: 'varchar', length: 255, nullable: true })
  observacion?: string;
}
