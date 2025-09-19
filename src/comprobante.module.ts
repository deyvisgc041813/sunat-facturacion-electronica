import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresaOrmEntity } from './infrastructure/database/entity/EmpresaOrmEntity';
import { FirmaService } from './infrastructure/sunat/firma/firma.service';
import { EmpresaRepositoryImpl } from './infrastructure/database/repository/empresa.repository.impl';
import { ComprobanteController } from './infrastructure/controllers/comprobante.controller';
import { ErrorLogRepositoryImpl } from './infrastructure/database/repository/error-log.repository.impl';
import { ErrorLogOrmEntity } from './infrastructure/database/entity/ErrorLogOrmEntity';
import { ClienteOrmEntity } from './infrastructure/database/entity/ClienteOrmEntity';
import { SerieOrmEntity } from './infrastructure/database/entity/SerieOrmEntity';
import { ComprobanteRepositoryImpl } from './infrastructure/database/repository/comprobante.repository.impl';
import { ComprobanteOrmEntity } from './infrastructure/database/entity/ComprobanteOrmEntity';
import { SunatService } from './infrastructure/sunat/send/sunat.service';
import { CreateComprobanteUseCase } from './application/comprobante/base/CreateComprobanteUseCase';
import { CatalogoModule } from './catalogo.module';
import { UpdateComprobanteUseCase } from './application/comprobante/update/UpdateComprobanteUseCase';
import { SunatLogOrmEntity } from './infrastructure/database/entity/SunatLogOrmEntity';
import { SunatLogRepositoryImpl } from './infrastructure/database/repository/sunat-log.repository.impl';
import { XmlBuilderInvoiceService } from './infrastructure/sunat/xml/xml-builder-invoice.service';
import { CreateNotaCreditoUseCase } from './application/comprobante/create/CreateNotaCreditoUseCase';
import { XmlBuilderNotaCreditoService } from './infrastructure/sunat/xml/xml-builder-nota-credito.service';
import { FindByEmpAndTipComAndSerieUseCase } from './application/Serie/FindByEmpAndTipComAndSerieUseCase';
import { GetByCorrelativoComprobantesUseCase } from './application/comprobante/query/GetByCorrelativoComprobantesUseCase';
import { SerieRepositoryImpl } from './infrastructure/database/repository/serie.repository.impl';
import { SerieAuditoriaOrmEntity } from './infrastructure/database/entity/SerieAuditoriaOrmEntity';
import { TributoTasaOrmEntity } from './infrastructure/database/entity/TributoTasaOrmEntity';
import { TasaTributoModule } from './tasa-tributo.module';
import { FindTasaByCodeUseCase } from './application/Tasa/FindTasaByCodeUseCase';
import { CreateNotaDebitoUseCase } from './application/comprobante/create/CreateNotaDebitoUseCase';
import { XmlBuilderNotaDebitoService } from './infrastructure/sunat/xml/xml-builder-nota-debito.service';
import { CreateInvoiceUseCase } from './application/comprobante/create/CreateInvoiceUseCase';
import { ValidarAnulacionComprobanteUseCase } from './application/comprobante/validate/ValidarAnulacionComprobanteUseCase';
import { AnularComprobanteUseCase } from './application/comprobante/update/AnularComprobanteUseCase';
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
    FindTasaByCodeUseCase
  ],
  exports: [
    EmpresaRepositoryImpl,
    ErrorLogRepositoryImpl,
    SunatLogRepositoryImpl,
    ComprobanteRepositoryImpl,
    ValidarAnulacionComprobanteUseCase
  ],
})
export class ComprobanteModule {}
