import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresaOrmEntity } from './infrastructure/database/entity/EmpresaOrmEntity';
import { XmlBuilderService } from './infrastructure/sunat/xml/xml-builder.service';
import { FirmaService } from './infrastructure/sunat/firma/firma.service';
import { SunatService } from './infrastructure/sunat/cliente/sunat.service';
import { EmpresaRepositoryImpl } from './infrastructure/database/repository/empresa.repository.impl';
import { ComprobanteController } from './infrastructure/controllers/comprobante.controller';
import { ErrorLogRepositoryImpl } from './infrastructure/database/repository/error-log.repository.impl';
import { ErrorLogOrmEntity } from './infrastructure/database/entity/ErrorLogOrmEntity';
import { ClienteOrmEntity } from './infrastructure/database/entity/ClienteOrmEntity';
import { SerieOrmEntity } from './infrastructure/database/entity/SerieOrmEntity';
import { ComprobanteRepositoryImpl } from './infrastructure/database/repository/comprobante.repository.impl';
import { ComprobanteOrmEntity } from './infrastructure/database/entity/ComprobanteOrmEntity';
@Module({
  imports: [TypeOrmModule.forFeature([EmpresaOrmEntity, ClienteOrmEntity, SerieOrmEntity, ErrorLogOrmEntity, ComprobanteOrmEntity])],
  controllers: [ComprobanteController],
  providers: [
    XmlBuilderService,
    FirmaService,
    SunatService,
    EmpresaRepositoryImpl,
    ErrorLogRepositoryImpl,
    ComprobanteRepositoryImpl
  ],
  exports: [EmpresaRepositoryImpl, ErrorLogRepositoryImpl, ComprobanteRepositoryImpl],
})
export class ComprobanteModule {}