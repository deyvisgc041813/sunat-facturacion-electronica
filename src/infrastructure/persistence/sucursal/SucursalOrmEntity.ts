import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { EmpresaOrmEntity } from '../empresa/empesa.orm.entity';
import { ProductoOrmEntity } from '../producto/ProductoOrmEntity';
import { ComprobanteOrmEntity } from '../comprobante/ComprobanteOrmEntity';
import { ResumenBoletasOrmEntity } from '../resumen/ResumenBoletasOrmEntity';
import { BajaComprobanteOrmEntity } from '../comunicacion-baja/BajaComprobanteOrmEntity';
import { SunatLogOrmEntity } from '../sunat-log/SunatLogOrmEntity';
import { UsuariosOrmEntity } from '../auth/UsuariosOrmEntity';
import { DistritoOrmEntity } from '../ubigeo/distrito.orm.entity';
import { SerieOrmEntity } from '../serie-comprobante/SerieOrmEntity';

@Entity({ name: 'sucursal' })
export class SucursalOrmEntity {
  @PrimaryGeneratedColumn({ name: 'sucursal_id' })
  sucursalId: number;

  @ManyToOne(() => EmpresaOrmEntity, (empresa) => empresa.sucursales, {
    eager: true,
  })
  @JoinColumn({ name: 'empresa_id' })
  empresa: EmpresaOrmEntity;
  @ManyToOne(
    () => DistritoOrmEntity,
    (distrito: DistritoOrmEntity) => distrito.sucursales,
    { eager: true },
  )
  @JoinColumn({ name: 'distrito_id' })
  distrito: DistritoOrmEntity;

  @OneToMany(
    () => ProductoOrmEntity,
    (producto: ProductoOrmEntity) => producto.sucursal,
  )
  productos: ProductoOrmEntity[];

  @OneToMany(() => SerieOrmEntity, (serie: SerieOrmEntity) => serie.sucursal)
  series: SerieOrmEntity[];

  @OneToMany(
    () => ComprobanteOrmEntity,
    (comprobante: ComprobanteOrmEntity) => comprobante.sucursal,
  )
  comprobantes: ComprobanteOrmEntity[];
  //Relación con ResumenBoletas
  @OneToMany(() => ResumenBoletasOrmEntity, (resumen) => resumen.sucursal)
  resumenes: ResumenBoletasOrmEntity[];
  @OneToMany(() => BajaComprobanteOrmEntity, (baja) => baja.sucursal)
  comunicacionBaja: BajaComprobanteOrmEntity[];

  @ManyToMany(() => UsuariosOrmEntity, (user) => user.sucursales)
  usuarios: UsuariosOrmEntity[];

  @OneToMany(() => SunatLogOrmEntity, (logs) => logs.sucursal)
  sunatLog: SunatLogOrmEntity[];

  @Column({ type: 'varchar', length: 30 })
  codigo: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 255 })
  direccion: string;

  @Column({ type: 'varchar', length: 6, nullable: true })
  ubigeo: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({
    name: 'signature_id',
    type: 'varchar',
    length: 50,
    default: 'SIGN-DEFAULT',
  })
  signatureId: string;

  @Column({
    name: 'signature_note',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  signatureNote: string;

  @Column({ name: "estado", type: 'char', length: 1, 'default': "1" })
  estado: string;
  @Column({
    name: 'codigo_establecimiento_sunat',
    type: 'varchar',
    length: 4,
    default: '0000',
  })
  codigoEstablecimiento: string;
  @Column({ name: 'usuario_registro', type: 'varchar', length: 50 })
  usuarioRegistro: string;
  @Column({ name: 'usuario_modificacion', type: 'varchar', length: 50 })
  usuarioModificacion?: string;
  @Column({ name: 'entorno', type: 'varchar', length: 10, default: 'BETA' })
  entorno: string;
  @CreateDateColumn({ name: 'fecha_registro', type: 'timestamp' })
  fechaRegistro: Date;
  @CreateDateColumn({ name: 'fecha_modificacion', type: 'timestamp' })
  fechaModificacion: Date;
}
