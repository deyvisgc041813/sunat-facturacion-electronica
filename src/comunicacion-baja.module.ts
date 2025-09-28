import { Module } from '@nestjs/common';
import { BajaComprobanteOrmEntity } from './infrastructure/persistence/comunicacion-baja/BajaComprobanteOrmEntity';
import { BajaComprobanteDetalleOrmEntity } from './infrastructure/persistence/comunicacion-baja/BajaComprobanteDetalleOrmEntity';
import { EmpresaOrmEntity } from './infrastructure/persistence/empresa/EmpresaOrmEntity';
import { ErrorLogOrmEntity } from './infrastructure/persistence/error-log/ErrorLogOrmEntity';
import { ComprobanteOrmEntity } from './infrastructure/persistence/comprobante/ComprobanteOrmEntity';
import { SunatLogOrmEntity } from './infrastructure/persistence/sunat-log/SunatLogOrmEntity';
import { CatalogoModule } from './catalogo.module';
import { ComprobanteModule } from './comprobante.module';
import { ComunicaciomBajaController } from './adapter/web/controller/comunicacion.baja.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateComunicacionBajaUseCase } from './application/comunicacion-baja/create/CreateComunicacionBajaUseCase';
import { ComunicacionBajaRepositoryImpl } from './infrastructure/persistence/comunicacion-baja/baja.repository.impl';
import { XmlBuilderComunicacionBajaService } from './infrastructure/sunat/xml/xml-builder-comunicacion-baja.service';
import { GetStatusBajaStatusUseCase } from './application/comunicacion-baja/query/GetStatusBajaStatusUseCase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BajaComprobanteOrmEntity,
      BajaComprobanteDetalleOrmEntity,
      EmpresaOrmEntity,
      ErrorLogOrmEntity,
      ComprobanteOrmEntity,
      SunatLogOrmEntity,
    ]),
    CatalogoModule,
    ComprobanteModule,
  ],
  controllers: [ComunicaciomBajaController],
  providers: [
    CreateComunicacionBajaUseCase,
    GetStatusBajaStatusUseCase,
    XmlBuilderComunicacionBajaService,
    ComunicacionBajaRepositoryImpl,
  ],
  exports: [ComunicacionBajaRepositoryImpl],
})
export class ComunicacionBajaModule {}
