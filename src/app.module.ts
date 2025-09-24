import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ClienteModule } from './cliente.module';
import { ProductoModule } from './producto.module';
import { EmpresaModule } from './empresa.module';
import { CatalogoModule } from './catalogo.module';
import { SerieModule } from './serie.module';
import { SerieAuditoriaModule } from './serie-auditoria.module';
import { ComprobanteModule } from './comprobante.module';
import { ErrorLogModule } from './error-log.module';
import { TasaTributoModule } from './tasa-tributo.module';
import { ResumenBoletasModule } from './resumen-boletas.module';
import { ComunicacionBajaModule } from './comunicacion-baja.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
   TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT ?? '3306', 10) || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '123456',
      database: process.env.DB_NAME || 'facturacion_electronica_pe',
      autoLoadEntities: true,
      synchronize: false, // ⚠️ ponlo en true solo en desarrollo
    }),
   ClienteModule,
   ProductoModule,
   EmpresaModule,
   CatalogoModule,
   SerieModule,
   SerieAuditoriaModule,
   ComprobanteModule,
   ErrorLogModule,
   TasaTributoModule,
   ResumenBoletasModule,
   ComunicacionBajaModule
  ],
  
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
