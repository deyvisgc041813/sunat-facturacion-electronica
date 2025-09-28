import { Module } from '@nestjs/common';
import { EmpresaOrmEntity } from './infrastructure/persistence/empresa/EmpresaOrmEntity';
import { ErrorLogOrmEntity } from './infrastructure/persistence/error-log/ErrorLogOrmEntity';
import { ComprobanteOrmEntity } from './infrastructure/persistence/comprobante/ComprobanteOrmEntity';
import { SunatLogOrmEntity } from './infrastructure/persistence/sunat-log/SunatLogOrmEntity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResumenBoletasOrmEntity } from './infrastructure/persistence/resumen/ResumenBoletasOrmEntity';
import { ResumenBoletasDetalleOrmEntity } from './infrastructure/persistence/resumen/ResumenBoletasDetalleOrmEntity';
import { CatalogoModule } from './catalogo.module';
import { ComprobanteModule } from './comprobante.module';
import { XmlBuilderResumenService } from './infrastructure/sunat/xml/xml-builder-resumen.service';
import { ResumenController } from './adapter/web/controller/resumen.controller';
import { CreateResumenUseCase } from './application/resumen/create/CreateResumenUseCase';
import { GetNextCorrelativoUseCase } from './application/resumen/query/GetNextCorrelativoUseCase';
import { ResumenRepositoryImpl } from './infrastructure/persistence/resumen/resumen.repository';
import { GetStatusResumenUseCase } from './application/resumen/query/GetStatusResumenUseCase';
import { ComprobanteRespuestaSunatOrmEntity } from './infrastructure/persistence/comprobante/ComprobanteRespuestaSunatOrmEntity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResumenBoletasOrmEntity,
      ResumenBoletasDetalleOrmEntity,
      EmpresaOrmEntity,
      ErrorLogOrmEntity,
      ComprobanteOrmEntity,
      ComprobanteRespuestaSunatOrmEntity,
      SunatLogOrmEntity
    ]),
    CatalogoModule,
    ComprobanteModule,
  ],
  controllers: [ResumenController],
  providers: [
    CreateResumenUseCase,
    GetNextCorrelativoUseCase,
    GetStatusResumenUseCase,
    XmlBuilderResumenService,
    ResumenRepositoryImpl
  ],
  exports: [ResumenRepositoryImpl],
})
export class ResumenBoletasModule {}
