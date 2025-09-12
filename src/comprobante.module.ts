import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresaOrmEntity } from './infrastructure/database/entity/EmpresaOrmEntity';
import { XmlBuilderService } from './infrastructure/sunat/xml/xml-builder.service';
import { FirmaService } from './infrastructure/sunat/firma/firma.service';
import { SunatService } from './infrastructure/sunat/cliente/sunat.service';
import { EmpresaRepositoryImpl } from './infrastructure/database/repository/empresa.repository.impl';
import { ComprobanteController } from './infrastructure/controllers/comprobante.controller';
import { CreateComprobanteUseCase } from './application/comprobante/CreateComprobanteUseCase';
import { ErrorLogRepositoryImpl } from './infrastructure/database/repository/error-log.repository.impl';
import { ErrorLogOrmEntity } from './infrastructure/database/entity/ErrorLogOrmEntity';
@Module({
  imports: [TypeOrmModule.forFeature([EmpresaOrmEntity, ErrorLogOrmEntity])],
  controllers: [ComprobanteController],
  providers: [
    XmlBuilderService,
    FirmaService,
    SunatService,
    EmpresaRepositoryImpl,
    ErrorLogRepositoryImpl,
    CreateComprobanteUseCase,
  ],
  exports: [CreateComprobanteUseCase, EmpresaRepositoryImpl, ErrorLogRepositoryImpl],
})
export class ComprobanteModule {}