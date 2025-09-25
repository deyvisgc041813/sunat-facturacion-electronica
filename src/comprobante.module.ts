import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresaOrmEntity } from './infrastructure/persistence/empresa/EmpresaOrmEntity';
import { FirmaService } from './infrastructure/sunat/firma/firma.service';
import { EmpresaRepositoryImpl } from './infrastructure/persistence/empresa/empresa.repository.impl';
import { ComprobanteController } from './adapter/web/controller/comprobante.controller';
import { ErrorLogRepositoryImpl } from './infrastructure/persistence/error-log/error-log.repository.impl';
import { ErrorLogOrmEntity } from './infrastructure/persistence/error-log/ErrorLogOrmEntity';
import { ClienteOrmEntity } from './infrastructure/persistence/cliente/ClienteOrmEntity';
import { ComprobanteRepositoryImpl } from './infrastructure/persistence/comprobante/comprobante.repository.impl';
import { ComprobanteOrmEntity } from './infrastructure/persistence/comprobante/ComprobanteOrmEntity';
import { SunatService } from './infrastructure/sunat/send/sunat.service';
import { CreateComprobanteUseCase } from './application/comprobante/base/CreateComprobanteUseCase';
import { CatalogoModule } from './catalogo.module';
import { UpdateComprobanteUseCase } from './application/comprobante/update/UpdateComprobanteUseCase';
import { SunatLogOrmEntity } from './infrastructure/persistence/sunat-log/SunatLogOrmEntity';
import { XmlBuilderInvoiceService } from './infrastructure/sunat/xml/xml-builder-invoice.service';
import { CreateNotaCreditoUseCase } from './application/comprobante/create/CreateNotaCreditoUseCase';
import { XmlBuilderNotaCreditoService } from './infrastructure/sunat/xml/xml-builder-nota-credito.service';
import { FindByEmpAndTipComAndSerieUseCase } from './application/Serie/FindByEmpAndTipComAndSerieUseCase';
import { GetByCorrelativoComprobantesUseCase } from './application/comprobante/query/GetByCorrelativoComprobantesUseCase';
import { SerieRepositoryImpl } from './infrastructure/persistence/serie/serie.repository.impl';
import { SerieAuditoriaOrmEntity } from './infrastructure/persistence/serie-log/SerieAuditoriaOrmEntity';
import { TributoTasaOrmEntity } from './infrastructure/persistence/tasa-tributo/TributoTasaOrmEntity';
import { TasaTributoModule } from './tasa-tributo.module';
import { FindTasaByCodeUseCase } from './application/Tasa/FindTasaByCodeUseCase';
import { CreateNotaDebitoUseCase } from './application/comprobante/create/CreateNotaDebitoUseCase';
import { XmlBuilderNotaDebitoService } from './infrastructure/sunat/xml/xml-builder-nota-debito.service';
import { CreateInvoiceUseCase } from './application/comprobante/create/CreateInvoiceUseCase';
import { ValidarAnulacionComprobanteUseCase } from './application/comprobante/validate/ValidarAnulacionComprobanteUseCase';
import { AnularComprobanteUseCase } from './application/comprobante/update/AnularComprobanteUseCase';
import { SunatLogRepositoryImpl } from './infrastructure/persistence/sunat-log/sunat-log.repository.impl';
import { SerieOrmEntity } from './infrastructure/persistence/serie/SerieOrmEntity';
import { GetValidatedCpeUseCase } from './application/comprobante/query/GetValidatedCpeUseCase';
import { GetStatusValidateCpeUseCase } from './application/comprobante/query/GetStatusValidateCpeUseCase';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmpresaOrmEntity,
      ClienteOrmEntity,
      SerieOrmEntity,
      SerieAuditoriaOrmEntity,
      ErrorLogOrmEntity,
      ComprobanteOrmEntity,
      SunatLogOrmEntity,
      TributoTasaOrmEntity
    ]),
    CatalogoModule,
    TasaTributoModule
  ],
  controllers: [ComprobanteController],
  providers: [
    XmlBuilderInvoiceService,
    XmlBuilderNotaCreditoService,
    XmlBuilderNotaDebitoService,
    FirmaService,
    SunatService,
    EmpresaRepositoryImpl,
    ErrorLogRepositoryImpl,
    SunatLogRepositoryImpl,
    ComprobanteRepositoryImpl,
    SerieRepositoryImpl,
    CreateComprobanteUseCase,
    UpdateComprobanteUseCase,
    CreateInvoiceUseCase,
    CreateNotaCreditoUseCase,
    CreateNotaDebitoUseCase,
    FindByEmpAndTipComAndSerieUseCase,
    GetByCorrelativoComprobantesUseCase,
    ValidarAnulacionComprobanteUseCase,
    AnularComprobanteUseCase,
    FindTasaByCodeUseCase,
    GetValidatedCpeUseCase,
    GetStatusValidateCpeUseCase
  ],
  exports: [
    ErrorLogRepositoryImpl,
    SunatLogRepositoryImpl,
    ComprobanteRepositoryImpl,
    ValidarAnulacionComprobanteUseCase,
    FirmaService,
    SunatService,
    EmpresaRepositoryImpl,
    ErrorLogRepositoryImpl,
    SunatLogRepositoryImpl,
    SerieRepositoryImpl,
    GetValidatedCpeUseCase
  ],
})
export class ComprobanteModule {}
