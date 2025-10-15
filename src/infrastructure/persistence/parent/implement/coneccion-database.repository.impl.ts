import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import { EEstadosGlobales } from 'src/util/estado.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { TenantConnectionOrmEntity } from '../entity/tenant.coneccion.orm.entity';
import { ITenantDatabaseRepositoryPort } from 'src/domain/parent/conecciones-database/port/tenant-database.repository.port';
import { TenantConecctionMapper } from 'src/domain/mapper/tenant-connecction.mapper';
import { TenantConnectionsResponseDto } from 'src/domain/parent/conecciones-database/dto/tenant-database.response.dto';

@Injectable()
export class TenantConnectionRepositoryImpl implements ITenantDatabaseRepositoryPort {

  constructor(
    @InjectRepository(TenantConnectionOrmEntity)
    private readonly tenantRepo: Repository<TenantConnectionOrmEntity>,
  ) {}
 async delete(dbName: string, sucursalId: number): Promise<void> {
    await this.tenantRepo.delete({sucursal: {sucursalId}, dbName: dbName})
  }
  async save(sucursalId: number, dbName: string, dbUser:string, dbPassword:string): Promise<void> {
    const saveOrm = new TenantConnectionOrmEntity()
    saveOrm.sucursal = ({ sucursalId: sucursalId } as any)
    saveOrm.dbName = dbName
    saveOrm.dbUser = dbUser
    saveOrm.dbPassword = dbPassword
    saveOrm.dbHost = process.env.DB_HOST || 'localhost'
    saveOrm.dbPort = parseInt(process.env.DB_PORT || '3306', 10)
    saveOrm.estado = EEstadosGlobales.ACTIVO 
    await this.tenantRepo.save(saveOrm);
  }
  async activate(sucursalId: number, dbName:string): Promise<void> {
    await this.tenantRepo.update({ sucursal: {sucursalId}, dbName }, { estado: EEstadosGlobales.ACTIVO });
  }

  async findBySubDominio(sucursalId:number, subDominio:string): Promise<TenantConnectionsResponseDto | null> {
    const coneccion = await this.tenantRepo.findOne({ where: { estado: EEstadosGlobales.ACTIVO,  sucursal: {sucursalId, subDominio} }, relations: ["sucursal"] });
    if(!coneccion) return null
    return TenantConecctionMapper.toDomain(coneccion) 
  }
  async findByDbUser(dbUser:string): Promise<TenantConnectionsResponseDto | null> {
    const coneccion = await this.tenantRepo.findOne({ where: { estado: EEstadosGlobales.ACTIVO, dbUser: dbUser }, relations: ["sucursal"] });
    if(!coneccion) return null
    return TenantConecctionMapper.toDomain(coneccion) 
  }
  async findByDbName(sucursalId: number, dbUser:string, dbName:string): Promise<TenantConnectionsResponseDto | null> {
    const coneccion = await this.tenantRepo.findOne({ where: { estado: EEstadosGlobales.ACTIVO, dbUser, dbName, sucursal: {sucursalId} }, relations: ["sucursal"] });
    if(!coneccion) return null
    return TenantConecctionMapper.toDomain(coneccion) 
  }
}