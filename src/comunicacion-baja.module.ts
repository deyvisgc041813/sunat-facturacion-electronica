import { Module } from '@nestjs/common';
import { BajaComprobanteOrmEntity } from './infrastructure/persistence/tenant/entity/comunicacion-baja/baja-comprobante.orm.entity';
import { BajaComprobanteDetalleOrmEntity } from './infrastructure/persistence/tenant/entity/comunicacion-baja/baja-comunicacion-detalle.orm.entity';
import { CatalogoModule } from './catalogo.module';
import { ComprobanteModule } from './comprobante.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { XmlBuilderComunicacionBajaService } from './infrastructure/sunat/xml/xml-builder-comunicacion-baja.service';
import { ComprobanteOrmEntity } from './infrastructure/persistence/tenant/entity/comprobante/comprobante.orm.entity';
import { SunatLogOrmEntity } from './infrastructure/persistence/tenant/entity/sunat-log.orm.entity';
import { ComunicacionBajaRepositoryImpl } from './infrastructure/persistence/tenant/implement/baja.repository.impl';
import { CreateComunicacionBajaUseCase } from './application/tenant/comunicacion-baja/create/CreateComunicacionBajaUseCase';
import { GetStatusBajaStatusUseCase } from './application/tenant/comunicacion-baja/query/GetStatusBajaStatusUseCase';
import { ComunicaciomBajaController } from './adapter/web/controller/tenant/comunicacion.baja.controller';
import { ComunicacionBajaService } from './domain/tenant/comunicacion-baja/service/comunicacion-baja.service';
import { EmpresaOrmEntity } from './infrastructure/persistence/parent/entity/empresa/empesa.orm.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BajaComprobanteOrmEntity,
      BajaComprobanteDetalleOrmEntity,
      EmpresaOrmEntity,
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
    ComunicacionBajaService
  ],
  exports: [ComunicacionBajaRepositoryImpl, ComunicacionBajaService],
})
export class ComunicacionBajaModule {}
