import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EmpresaOrmEntity } from './empesa.orm.entity';
import { EstadoCredencialEmpresaSunat } from 'src/util/estado.enum';

@Entity({ name: 'empresa_credenciales_sunat' })
export class EmpresaCredencialesOrmEntity {
  @PrimaryGeneratedColumn({ name: 'cred_id' })
  credId: number;

  @ManyToOne(() => EmpresaOrmEntity, (empresa) => empresa.credenciales, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'empresa_id' })
  empresa: EmpresaOrmEntity;

  @Column({ name: 'ambiente', type: 'enum', enum: ['beta', 'prod'], default: 'prod' })
  ambiente: string;

  @Column({ name: 'client_id', length: 150, nullable: true })
  clientId: string;

  @Column({ name: 'client_secret', length: 150, nullable: true })
  clientSecret: string;

  @Column({ name: 'usuario_sol_secundario', length: 50, nullable: false })
  usuarioSolSecundario: string;

  @Column({ name: 'clave_sol_secundario', length: 100, nullable: false })
  claveSolSecundario: string;

  @Column({ name: 'certificado_digital', type: 'longblob', nullable: false })
  certificadoDigital: Buffer;

  @Column({ name: 'clave_certificado', length: 100, nullable: false })
  claveCertificado: string;
  // Nombre del archivo certificado (.pfx o .pem)
  @Column({ name: 'certificado_nombre', length: 255, nullable: true })
  certificadoNombre: string;
  // Hash SHA256 del certificado

  @Column({ name: 'certificado_hash', length: 255, nullable: true })
  certificadoHash: string;
 // Titular del certificado (subject CN)
  @Column({ name: 'certificado_subject', length: 255, nullable: true })
  certificadoSubject: string;
  // Emisor del certificado (issuer CN)
  @Column({ name: 'certificado_issuer', length: 255, nullable: true })
  certificadoIssuer: string;
  // Fecha desde la que es válido
  @Column({ name: 'certificado_valido_desde', type: 'date', nullable: true })
  certificadoValidoDesde: Date;
  // Fecha hasta la que es válido
  @Column({ name: 'certificado_valido_hasta', type: 'date', nullable: true })
  certificadoValidoHasta: Date;

  @Column({ name: 'certificado_public_id', length: 255, nullable: true })
  certificadoPublicId: string;

  @Column({ name: 'token', type: 'text', nullable: true })
  token: string;

  @Column({ name: 'token_expira', type: 'datetime', nullable: true })
  tokenExpira: Date;

  @CreateDateColumn({ name: 'fecha_registro', type: 'datetime' })
  fechaRegistro: Date;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoCredencialEmpresaSunat,
    default: EstadoCredencialEmpresaSunat.VIGENTE,
  })
  estado: string;
}
