import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { SucursalOrmEntity } from './sucursal.orm.entity';

@Entity('tenant_connections')
export class TenantConnectionOrmEntity {
  @PrimaryGeneratedColumn({name: "conecction_id"})
  coneccionId: number;
  @Column({name: "bd_name", type: "varchar", length: 255})
  dbName: string;
  @Column({ name: "status", type: "char", length: 1,  default: '1' })
  estado: string; 
  @Column({ name: "created_at", type: 'timestamp' })
  fechaRegistro: Date;
  @Column({name: "db_user", type: "varchar", length: 50})
  dbUser: string; 
  @Column({name: "db_password", type: "varchar", length: 255})
  dbPassword: string; 
  @Column({name: "db_host", type: "varchar", length: 50, default: 'localhost'})
  dbHost: string; 
  @Column({name: "db_port", type: "int", default: 3306})
  dbPort: number; 
  @OneToOne(() => SucursalOrmEntity, (sucursal) => sucursal.tenantConnection)
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: SucursalOrmEntity;
}
