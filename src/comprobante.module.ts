import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresaOrmEntity } from './infrastructure/database/entity/EmpresaOrmEntity';
import { XmlBuilderService } from './infrastructure/sunat/xml/xml-builder.service';
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
import { UpdateComprobanteUseCase } from './application/comprobante/base/UpdateComprobanteUseCase';
import { SunatLogOrmEntity } from './infrastructure/database/entity/SunatLogOrmEntity';
import { SunatLogRepositoryImpl } from './infrastructure/database/repository/sunat-log.repository.impl';
import { CreateInvoiceUseCase } from './application/comprobante/CreateInvoiceUseCase';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmpresaOrmEntity,
      ClienteOrmEntity,
      SerieOrmEntity,
      ErrorLogOrmEntity,
      ComprobanteOrmEntity,
      SunatLogOrmEntity,
    ]),
    CatalogoModule,
  ],
  controllers: [ComprobanteController],
  providers: [
    XmlBuilderService,
    FirmaService,
    SunatService,
    EmpresaRepositoryImpl,
    ErrorLogRepositoryImpl,
    SunatLogRepositoryImpl,
    ComprobanteRepositoryImpl,
    CreateComprobanteUseCase,
    UpdateComprobanteUseCase,
    CreateInvoiceUseCase,
  ],
  exports: [
    EmpresaRepositoryImpl,
    ErrorLogRepositoryImpl,
    SunatLogRepositoryImpl,
    ComprobanteRepositoryImpl,
  ],
})
export class ComprobanteModule {}
