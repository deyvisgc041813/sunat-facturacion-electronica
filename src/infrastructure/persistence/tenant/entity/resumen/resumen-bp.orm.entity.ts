import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { ResumenBoletasDetalleOrmEntity } from './resumen-bp-detalle.orm.entity';
@Entity({ name: 'resumen_boletas' })
export class ResumenBoletasOrmEntity {
  @PrimaryGeneratedColumn({ name: 'res_bol_id' })
  resBolId: number;
  @Column({ name: 'sucursal_id', type: "int" })
  sucursalId: number;
  
  @OneToMany(
    () => ResumenBoletasDetalleOrmEntity,
    (detalle) => detalle.resumen,
    {
      cascade: true,
    },
  )
  detalles: ResumenBoletasDetalleOrmEntity[];
  @Column({ name: 'fecha_generacion', type: 'date' })
  fechaGeneracion: Date;

  @Column({ name: 'fec_referencia', type: 'date' })
  fechaReferencia: Date;
  @Column({ name: 'fecha_recepcion_sunat', type: 'date' })
  fechaRespuestaSunat: Date;
  @Column({ name: 'codigo_respuesta_sunat', type: 'varchar', length: 20 })
  codResPuestaSunat: string;
  @Column({ name: 'mensaje_sunat', type: 'varchar', length: 250 })
  mensajeSunat: string;

  @Column({ type: 'int' })
  correlativo: number;

  @Column({
    name: 'nombre_archivo',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  nombreArchivo: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado: string;

  @Column({ type: 'longtext', nullable: true })
  xml: string;

  @Column({ type: 'longtext', nullable: true })
  cdr: string;

  @Column({
    name: 'hash_resumen',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  hashResumen: string;
  @Column({ type: 'varchar', length: 50, nullable: true })
  ticket: string;
  @Column({ name: 'resumen_id', type: 'varchar', length: 50, nullable: true })
  resumenId: string;
  @Column({ name: 'observaciones_sunat', type: 'longtext', nullable: true })
  observacionSunat?: string;
}
