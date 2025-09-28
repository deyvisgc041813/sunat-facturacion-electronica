import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ComprobanteOrmEntity } from './ComprobanteOrmEntity';

@Entity({ name: 'comprobante_respuesta_sunat' })
export class ComprobanteRespuestaSunatOrmEntity {
  @PrimaryGeneratedColumn({name: "comprobante_rspt_id"})
  compRespIdSunat: number;
  @OneToOne(() => ComprobanteOrmEntity, (comprobante) => comprobante.respuestaSunat, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'comprobante_id' })
  comprobante: ComprobanteOrmEntity;

  @Column({ name: "xml_firmado", type: 'longtext', nullable: true })
  xmlFirmado: string;

  @Column({ name: "hash_cpe", type: 'varchar', length: 100, nullable: true })
  hashCpe: string;

  @Column({ type: 'longblob', nullable: true })
  cdr: Buffer;
  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
