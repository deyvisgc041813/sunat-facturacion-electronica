import { ClienteModule } from './cliente.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirmaService } from './infrastructure/sunat/firma/firma.service';
import { ComprobanteController } from './adapter/web/controller/tenant/comprobante.controller';
import { SunatService } from './infrastructure/sunat/send/sunat.service';
import { CatalogoModule } from './catalogo.module';
import { XmlBuilderInvoiceService } from './infrastructure/sunat/xml/xml-builder-invoice.service';
import { XmlBuilderNotaCreditoService } from './infrastructure/sunat/xml/xml-builder-nota-credito.service';
import { SerieAuditoriaOrmEntity } from './infrastructure/persistence/tenant/entity/serie-comprobante/serie-auditoria.orm.entity';
import { TributoTasaOrmEntity } from './infrastructure/persistence/parent/entity/tributo-tasa.orm.entity';
import { TasaTributoModule } from './tasa-tributo.module';
import { FindTasaByCodeUseCase } from './application/parent/Tasa/FindTasaByCodeUseCase';
import { XmlBuilderNotaDebitoService } from './infrastructure/sunat/xml/xml-builder-nota-debito.service';
import { SunatLogRepositoryImpl } from './infrastructure/persistence/tenant/implement/auditoria/sunat-log.repository.impl';
import { FindCatalogosUseCase } from './application/parent/catalogo/FindCatalogosUseCase';
import { SerieOrmEntity } from './infrastructure/persistence/tenant/entity/serie-comprobante/serie-comprobante.orm.entity';
import { GetBySucursalAndTipComAndSerieUseCase } from './application/tenant/serie-comprobante/get-serie-by-sucursal-and-tipo-comprobante.usecase';
import { SerieComprobanteModule } from './serie-comprobante.module';
import { EmpresaOrmEntity } from './infrastructure/persistence/parent/entity/empesa.orm.entity';
import { ClienteOrmEntity } from './infrastructure/persistence/parent/entity/cliente.orm.entity';
import { ComprobanteOrmEntity } from './infrastructure/persistence/tenant/entity/comprobante/comprobante.orm.entity';
import { SunatLogOrmEntity } from './infrastructure/persistence/tenant/entity/sunat-log.orm.entity';
import { ComprobanteRespuestaSunatOrmEntity } from './infrastructure/persistence/tenant/entity/comprobante/conprobante-respuesta-sunat.orm.entity';
import { SucursalOrmEntity } from './infrastructure/persistence/parent/entity/sucursal.orm.entity';
import { ComprobanteRepositoryImpl } from './infrastructure/persistence/tenant/implement/comprobante/comprobante.repository.impl';
import { EmpresaRepositoryImpl } from './infrastructure/persistence/parent/implement/empresa.repository.impl';
import { SerieComprobanteRepositoryImpl } from './infrastructure/persistence/tenant/implement/serie-comprobante.repository.impl';
import { CreateComprobanteUseCase } from './application/tenant/comprobante/base/CreateComprobanteUseCase';
import { UpdateComprobanteUseCase } from './application/tenant/comprobante/update/UpdateComprobanteUseCase';
import { CreateInvoiceUseCase } from './application/tenant/comprobante/create/CreateInvoiceUseCase';
import { CreateNotaCreditoUseCase } from './application/tenant/comprobante/create/CreateNotaCreditoUseCase';
import { CreateNotaDebitoUseCase } from './application/tenant/comprobante/create/CreateNotaDebitoUseCase';
import { GetByComprobanteAceptadoUseCase } from './application/tenant/comprobante/query/GetByComprobanteAceptadoUseCase';
import { ValidarAnulacionComprobanteUseCase } from './application/tenant/comprobante/validate/ValidarAnulacionComprobanteUseCase';
import { AnularComprobanteUseCase } from './application/tenant/comprobante/update/AnularComprobanteUseCase';
import { GetValidatedCpeUseCase } from './application/tenant/comprobante/query/GetValidatedCpeUseCase';
import { GetStatusValidateCpeUseCase } from './application/tenant/comprobante/query/GetStatusValidateCpeUseCase';
import { TenantConeccionesModule } from './tenant-conecciones.module';
import { TenantContextModule } from './tenant-context.module';
import { ComprobanteRespuestaSunatRepositoryImpl } from './infrastructure/persistence/tenant/implement/comprobante/comprobante-respuesta.sunat.repository.impl';
import { LogRespuestaSunatRepositoryImpl } from './infrastructure/persistence/tenant/implement/comprobante/log-respuesta-sunat-fallida.repository.impl';
import { LogRespuestaSunatOrmEntity } from './infrastructure/persistence/tenant/entity/comprobante/log-respuesta-sunat-fallida.orm.entity';
import { SearchDocumentService } from './application/tenant/comprobante/services/search-document.service';
import { SucursalModule } from './sucursal.module';
import { ClienteService } from './domain/parent/cliente/service/cliente.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmpresaOrmEntity,
      ClienteOrmEntity,
      SerieOrmEntity,
      SerieAuditoriaOrmEntity,
      ComprobanteOrmEntity,
      SunatLogOrmEntity,
      TributoTasaOrmEntity,
      ComprobanteRespuestaSunatOrmEntity,
      LogRespuestaSunatOrmEntity,
      SucursalOrmEntity,
    ]),
    CatalogoModule,
    TasaTributoModule,
    SerieComprobanteModule,
    ClienteModule,
    TenantConeccionesModule,
    TenantContextModule,
    SucursalModule
  ],
  controllers: [ComprobanteController],
  providers: [
    {
      provide: SearchDocumentService,
      useFactory: (clienteService: ClienteService ) => new SearchDocumentService(clienteService),
      inject: [ClienteService],
    },
    XmlBuilderInvoiceService,
    XmlBuilderNotaCreditoService,
    XmlBuilderNotaDebitoService,
    FirmaService,
    SunatService,
    EmpresaRepositoryImpl,
    SunatLogRepositoryImpl,
    ComprobanteRepositoryImpl,
    SerieComprobanteRepositoryImpl,
    ComprobanteRespuestaSunatRepositoryImpl,
    LogRespuestaSunatRepositoryImpl,
    CreateComprobanteUseCase,
    UpdateComprobanteUseCase,
    CreateInvoiceUseCase,
    CreateNotaCreditoUseCase,
    CreateNotaDebitoUseCase,
    GetBySucursalAndTipComAndSerieUseCase,
    GetByComprobanteAceptadoUseCase,
    ValidarAnulacionComprobanteUseCase,
    AnularComprobanteUseCase,
    FindTasaByCodeUseCase,
    GetValidatedCpeUseCase,
    GetStatusValidateCpeUseCase,
    FindCatalogosUseCase
  ],
  exports: [
    SunatLogRepositoryImpl,
    ComprobanteRepositoryImpl,
    ValidarAnulacionComprobanteUseCase,
    FirmaService,
    SunatService,
    EmpresaRepositoryImpl,
    SunatLogRepositoryImpl,
    SerieComprobanteRepositoryImpl,
    GetValidatedCpeUseCase,
    FindCatalogosUseCase,
    ComprobanteRespuestaSunatRepositoryImpl,
    LogRespuestaSunatRepositoryImpl,
    TenantConeccionesModule,
    TenantContextModule,
    SucursalModule
  ],
})
export class ComprobanteModule {}
