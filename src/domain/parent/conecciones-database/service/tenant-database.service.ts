import { Injectable } from '@nestjs/common';
import { TenantConnectionRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/coneccion-database.repository.impl';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as tenantEntities from '../../../../infrastructure/persistence/tenant/entity/index';
import { EEstadosGlobales } from 'src/util/estado.enum';
import { CryptoUtil } from 'src/util/CryptoUtil';
import { generateTenantCredentials } from 'src/util/Helpers';
import { ETablaAudit } from 'src/util/general.enum';
import { TipoComprobanteEnum } from 'src/util/catalogo.enum';
import { SQL_EXISTE_SPGC, SQL_SPGUARDAR_COMPROBANTE } from 'src/util/constantes';
import { BusinessLogicException } from 'src/adapter/web/exception/exeception-dynamic';
/**
 * Servicio de gestión de bases de datos multi-tenant (una BD por sucursal)
 * - 🔹 Lazy connection (solo conecta cuando se necesita)
 * - 🔹 TTL de inactividad (cierra conexiones que no se usan)
 * - 🔹 Mutex (evita crear dos conexiones simultáneamente)
 * - 🔹 Validación de nombres de base de datos
 * - 🔹 Sin `synchronize: true` (seguro para producción)
 * - 🔹 Validación de tenants activos
 */
@Injectable()
export class TenantDatabaseService {
  // Conexiones activas
  private connections: Map<string, DataSource> = new Map();
  // Mutex para evitar doble inicialización simultánea
  private initializing: Map<string, Promise<DataSource>> = new Map();

  // Timers para cierre por inactividad
  private idleTimers: Map<string, NodeJS.Timeout> = new Map();

  // Tiempo de vida máximo de una conexión sin uso (en minutos)
  private readonly TTL_MIN = Number(process.env.TENANT_TTL_MIN || 15);

  constructor(private readonly tenantRepo: TenantConnectionRepositoryImpl) {}

  async createTenantUserAndDatabase(
    username: string,
    password: string,
    dbName: string,
    existDbUser: boolean,
  ): Promise<void> {
    if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
      throw new BusinessLogicException('Nombre de base de datos inválido');
    }
    const rootDS = new DataSource({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USER || 'root', // usuario con permisos globales
      password: process.env.DB_PASS || '',
      database: 'mysql',
    });

    try {
      await rootDS.initialize();
      // Crear base de datos si no existe
      await rootDS.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
      if (!existDbUser) {
        // Crear usuario y asignar privilegios
        await rootDS.query(
          `CREATE USER IF NOT EXISTS \`${username}\`@'%' IDENTIFIED BY '${password}';`,
        );
        await rootDS.query(
          `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO \`${username}\`@'%';`,
        );
        await rootDS.query(`FLUSH PRIVILEGES;`);
        console.log(`Usuario creado: ${username} con acceso a ${dbName}`);
        console.log(`password: ${password}`);
      }
    } catch (err: any) {
      console.log('error ', err);
      throw err;
    } finally {
      await rootDS.destroy();
    }
  }

  /**
   * Crea una conexión de tenant (solo si no existe)
   * Incluye validación, migraciones y registro en caché
   */
  private async createTenantConnectionLocked(
    username: string,
    password: string,
    host: string,
    port: number,
    subDominio: string,
    dbName: string,
    existDbUser: boolean,
    sucursalId: number,
    tipoOperacion: string = 'create',
  ): Promise<DataSource> {
    await this.createTenantUserAndDatabase(
      username,
      password,
      dbName,
      existDbUser,
    );
    const entitiesArray = Array.isArray(tenantEntities)
      ? tenantEntities
      : Object.values(tenantEntities);
      const options: DataSourceOptions = {
      type: 'mysql',
      host,
      port,
      username,
      password,
      database: dbName,
      entities: entitiesArray,
      synchronize: false, //Seguro en producción (usar migraciones)
      migrationsRun: true, // Corre migraciones automáticamente
      migrations: [
        __dirname +
          '/../../../../infrastructure/persistence/tenant/migrations/*{.ts,.js}',
      ],
      logging: false,
    };
    const dataSource = new DataSource(options);
    await dataSource.initialize();
    this.connections.set(subDominio, dataSource);
    this.resetIdleTimer(subDominio);
 
    if (tipoOperacion == 'create') {
      await this.autoGenerateAndRunMigrations(dataSource);
      await this.createSpGuardarComprobanteIfNotExists(dataSource, dbName);
      await this.insertDefaultSeries(dataSource, sucursalId, tipoOperacion);

    }
    console.log(`Tenant conectado: ${subDominio}`);
    return dataSource;
  }
  /**
   * Cierra conexión por inactividad (TTL)
   * Libera memoria y sockets MySQL automáticamente
   */
  private resetIdleTimer(subDominio: string): void {
    if (this.idleTimers.has(subDominio)) {
      clearTimeout(this.idleTimers.get(subDominio)!);
    }
    const timer = setTimeout(
      async () => {
        const ds = this.connections.get(subDominio);
        if (ds && ds.isInitialized) {
          await ds.destroy();
          console.log(`Conexión cerrada por inactividad: ${subDominio}`);
        }
        this.connections.delete(subDominio);
        this.idleTimers.delete(subDominio);
      },
      this.TTL_MIN * 60 * 1000,
    );

    this.idleTimers.set(subDominio, timer);
  }
  /**
   * Obtiene o crea una conexión del tenant (lazy seguro)
   * - Valida que el tenant esté activo
   * - Usa mutex para evitar doble inicialización
   * - Actualiza TTL cada vez que se usa
   */
  async getTenantConnection(
    sucursalId: number,
    subDominio: string,
  ): Promise<DataSource> {
    // Si ya existe, devuélvela y reinicia el TTL
    const existing = this.connections.get(subDominio);
    if (existing?.isInitialized) {
      this.resetIdleTimer(subDominio);
      return existing;
    }

    // Evita inicializaciones duplicadas (mutex)
    if (this.initializing.has(subDominio)) {
      return this.initializing.get(subDominio)!;
    }
    // Busca tenant en la base principal
    const tenant = await this.tenantRepo.findBySubDominio(
      sucursalId,
      subDominio,
    );
    if (!tenant || tenant.estado !== EEstadosGlobales.ACTIVO) {
      throw new BusinessLogicException(
        `Tenant "${subDominio}" no está activo o no existe.`,
      );
    }
    subDominio = (
      subDominio.replace(/[^a-z0-9.]/gi, '').match(/^[^.]+/)?.[0] ?? ''
    ).replace(/-/g, '');
    const dbPassword = await CryptoUtil.decrypt(tenant.dbPassword);
    // Crea conexión protegida por mutex
    const promise = this.createTenantConnectionLocked(
      tenant.dbUser,
      dbPassword,
      tenant.dbHost,
      tenant.dbPort,
      subDominio,
      tenant.dbName,
      true,
      0,
      'getConecction',
    ).finally(() => this.initializing.delete(subDominio));
    this.initializing.set(subDominio, promise);
    return promise;
  }
  /**
   * Cierra manualmente una conexión de tenant (ej. baja de sucursal)
   */
  async closeTenantConnection(subDominio: string): Promise<void> {
    const connection = this.connections.get(subDominio);
    if (connection?.isInitialized) {
      await connection.destroy();
      console.log(`Conexión del tenant cerrada manualmente: ${subDominio}`);
    }
    this.connections.delete(subDominio);
    const timer = this.idleTimers.get(subDominio);
    if (timer) clearTimeout(timer);
    this.idleTimers.delete(subDominio);
  }
  /**
   * Activa un nuevo tenant (crea BD y lo registra)
   * No conecta aún — se conectará cuando se use por primera vez (lazy)
   */
  async createTenant(
    sucursalId: number,
    numRuc: string,
    subDominio: string,
  ): Promise<{
    usersDatabase : string,
    databaseName:string,
    databasePassword:string
  }> {
    console.log('INICIO crear tenant');
    const dbName = `${numRuc}_${subDominio}_db`;
    let { username, password } = generateTenantCredentials(numRuc);
    const existUserDb = await this.tenantRepo.findByDbUser(username);
    let existDbUser = false;
    if (existUserDb) {
      username = existUserDb?.dbUser;
      password = await CryptoUtil.decrypt(existUserDb.dbPassword);
      existDbUser = true;
    }
    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT || '3306', 10);
    await this.createTenantConnectionLocked(
      username,
      password,
      host,
      port,
      subDominio,
      dbName,
      existDbUser,
      sucursalId,
    );
    const dbPassword = await CryptoUtil.encrypt(password);
    await this.tenantRepo.save(sucursalId, dbName, username, dbPassword);
    console.log(`Tenant ${subDominio} activado con base ${dbName}`);
    return {
      usersDatabase: username,
      databaseName: dbName,
      databasePassword: await CryptoUtil.decrypt(dbPassword) 
    }
  }
  async deleteTenant(
    sucursalId: number,
    numRuc: string,
    subDominio: string,
  ): Promise<void> {
    const dbName = `${numRuc}_${subDominio}_db`;
    const userName = `user_${numRuc}`;
    console.log(`Iniciando desactivación del tenant: ${dbName}`);

    try {
      await this.closeTenantConnection(subDominio);
      await this.tenantRepo.delete(dbName, sucursalId);

      const adminDs = new DataSource({
        type: 'mysql',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
      });

      await adminDs.initialize();
      await adminDs.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
      await adminDs.query(`DROP USER IF EXISTS '${userName}'@'%';`);
      console.log(
        `Tenant ${dbName} y usuario ${userName} eliminados correctamente`,
      );
      await adminDs.destroy();
    } catch (error) {
      console.error(`Error al eliminar tenant ${dbName}`, error);
      throw error;
    }
  }
  /**
   * Lista de conexiones activas actualmente
   */
  listActiveConnections(): string[] {
    return Array.from(this.connections.keys());
  }
  /**
   * Genera automáticamente una migración si hay cambios en las entidades
   * y la ejecuta sobre el DataSource indicado.
   */
  async autoGenerateAndRunMigrations(dataSource: DataSource) {
    const queryRunner = dataSource.createQueryRunner();

    try {
      console.log(
        `Verificando cambios de esquema en ${dataSource.options.database}...`,
      );

      // Construir el esquema actual de la base de datos
      const schemaBuilder = dataSource.driver.createSchemaBuilder();
      const syncQueries = await schemaBuilder.log();

      // Si no hay cambios, salir
      if (!syncQueries || syncQueries.upQueries.length === 0) {
        console.log(
          `No hay cambios de esquema en ${dataSource.options.database}`,
        );
        return;
      }

      // Mostrar las queries detectadas (opcional)
      console.log(`Cambios detectados para ${dataSource.options.database}:`);
      for (const q of syncQueries.upQueries) {
        console.log('   »', q.query);
      }

      // 4Ejecutar los cambios
      console.log(`Aplicando cambios de esquema automáticamente...`);
      for (const q of syncQueries.upQueries) {
        await queryRunner.query(q.query);
      }

      console.log(
        `Migración automática aplicada correctamente en ${dataSource.options.database}`,
      );
    } catch (err) {
      console.error(
        `Error ejecutando migración automática en ${dataSource.options.database}:`,
        err,
      );
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
  private async createSpGuardarComprobanteIfNotExists(
    tempDS: DataSource,
    dbName: string,
  ): Promise<void> {
    try {
      // Verificar si existe
      const result: any[] = await tempDS.query(SQL_EXISTE_SPGC);
      const existe = result[0]?.total > 0;
      if (existe) {
        console.log(
          `El procedimiento sp_guardar_comprobante ya existe en ${dbName}`,
        );
        return;
      }
      // Crear procedimiento (solo si no existe)
      await tempDS.query(SQL_SPGUARDAR_COMPROBANTE);
      console.log(`Procedimiento sp_guardar_comprobante creado exitosamente en ${dbName}`,);
    } finally {
      await tempDS.destroy();
    }
  }
  private async insertDefaultSeries(
    tempDS: DataSource,
    sucursalId: number,
    typeOperacion: string,
  ): Promise<void> {
    try {
      if (typeOperacion == 'create') {
        const series = [
          { tipo: TipoComprobanteEnum.FACTURA, serie: 'F001' },
          { tipo: TipoComprobanteEnum.BOLETA, serie: 'B001' },
          { tipo: TipoComprobanteEnum.NOTA_CREDITO, serie: 'FC01' },
          { tipo: TipoComprobanteEnum.NOTA_DEBITO, serie: 'FD01' },
          { tipo: TipoComprobanteEnum.RESUMEN_DIARIO, serie: 'RC' },
          { tipo: TipoComprobanteEnum.COMUNICACION_BAJA, serie: 'RA' },
        ];
        await tempDS.initialize();
        for (const { tipo, serie } of series) {
          const [exists] = await tempDS.query(
            `SELECT 1 FROM ${ETablaAudit.SERIE_COMPROBANTE} WHERE sucursal_id = ? AND tipo_comprobante = ? AND serie = ? LIMIT 1`,
            [sucursalId, tipo, serie],
          );

          if (!exists) {
            await tempDS.query(
              `INSERT INTO ${ETablaAudit.SERIE_COMPROBANTE} (
                sucursal_id, tipo_comprobante, serie, correlativo_inicial, correlativo_actual,
                estado, fecha_registro, fecha_modificacion, usuario_registro, usuario_modificacion
              )
              VALUES (?, ?, ?, 1, 0, 1, NOW(), NOW(), 'system@auto', 'system@auto')`,
              [sucursalId, tipo, serie],
            );
          }
        }
        console.log(
          `Series iniciales creadas o validadas para sucursal ${sucursalId}`,
        );
      }
    } catch (err: any) {
      throw err;
    } finally {
      await tempDS.destroy();
    }
  }
}
