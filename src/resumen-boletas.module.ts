import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResumenBoletasOrmEntity } from './infrastructure/persistence/tenant/entity/resumen/resumen-bp.orm.entity';
import { ResumenBoletasDetalleOrmEntity } from './infrastructure/persistence/tenant/entity/resumen/resumen-bp-detalle.orm.entity';
import { CatalogoModule } from './catalogo.module';
import { ComprobanteModule } from './comprobante.module';
import { XmlBuilderResumenService } from './infrastructure/sunat/xml/xml-builder-resumen.service';
import { ComprobanteOrmEntity } from './infrastructure/persistence/tenant/entity/comprobante/comprobante.orm.entity';
import { ComprobanteRespuestaSunatOrmEntity } from './infrastructure/persistence/tenant/entity/comprobante/conprobante-respuesta-sunat.orm.entity';
import { SunatLogOrmEntity } from './infrastructure/persistence/tenant/entity/sunat-log.orm.entity';
import { ResumenRepositoryImpl } from './infrastructure/persistence/tenant/implement/resumen.impl.repository';
import { ResumenController } from './adapter/web/controller/tenant/resumen.controller';
import { CreateResumenUseCase } from './application/tenant/resumen/create/CreateResumenUseCase';
import { GetNextCorrelativoUseCase } from './application/tenant/resumen/query/GetNextCorrelativoUseCase';
import { GetStatusResumenUseCase } from './application/tenant/resumen/query/GetStatusResumenUseCase';
import { ResumenService } from './domain/tenant/resumen/service/resumen.service';
import { ComprobanteRepositoryImpl } from './infrastructure/persistence/tenant/implement/comprobante/comprobante.repository.impl';
import { SunatLogRepositoryImpl } from './infrastructure/persistence/tenant/implement/auditoria/sunat-log.repository.impl';
import { FirmaService } from './infrastructure/sunat/firma/firma.service';
import { SerieComprobanteRepositoryImpl } from './infrastructure/persistence/tenant/implement/serie-comprobante.repository.impl';
import { SunatService } from './infrastructure/sunat/send/sunat.service';
import { SucursalModule } from './sucursal.module';
import { SucursalService } from './domain/parent/sucursal/service/sucursal.service';
import { EmpresaOrmEntity } from './infrastructure/persistence/parent/entity/empresa/empesa.orm.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResumenBoletasOrmEntity,
      ResumenBoletasDetalleOrmEntity,
      EmpresaOrmEntity,
      ComprobanteOrmEntity,
      ComprobanteRespuestaSunatOrmEntity,
      SunatLogOrmEntity,
    ]),
    CatalogoModule,
    ComprobanteModule,
    SucursalModule,
  ],
  controllers: [ResumenController],
  providers: [
    ResumenService,
    CreateResumenUseCase,
    GetNextCorrelativoUseCase,
    GetStatusResumenUseCase,
    XmlBuilderResumenService,
    ResumenRepositoryImpl,
    ComprobanteRepositoryImpl,
    SunatLogRepositoryImpl,
    FirmaService,
    SerieComprobanteRepositoryImpl,
    SunatService,
    SucursalService,
  ],
  // providers: [
  //       // {
  //       //   provide: ResumenService,
  //       //   useFactory: (
  //       //     comprobanteRepositoryImpl: ComprobanteRepositoryImpl,
  //       //     resumenRepositoryImpl: ResumenRepositoryImpl,
  //       //     sunatLogRepositoryImpl: SunatLogRepositoryImpl,
  //       //     firmaService: FirmaService,
  //       //     serieComprobanteRepositoryImpl: SerieComprobanteRepositoryImpl,
  //       //     xmlBuilderResumenService: XmlBuilderResumenService,
  //       //     sunatService: SunatService,
  //       //     sucursalService:SucursalService
  //       //   ) =>
  //       //     new ResumenService(
  //       //       comprobanteRepositoryImpl,
  //       //       resumenRepositoryImpl,
  //       //       sunatLogRepositoryImpl,
  //       //       firmaService,
  //       //       serieComprobanteRepositoryImpl,
  //       //       xmlBuilderResumenService,
  //       //       sunatService,
  //       //       sucursalService
  //       //     ),
  //       //   inject: [
  //       //     ComprobanteRepositoryImpl,
  //       //     ResumenRepositoryImpl,
  //       //     SunatLogRepositoryImpl,
  //       //     FirmaService,
  //       //     SerieComprobanteRepositoryImpl,
  //       //     XmlBuilderResumenService,
  //       //     SunatService,
  //       //     SucursalService
  //       //   ],
  //       // },
  //     ResumenService, // ✅ cambia esto
  //   CreateResumenUseCase,
  //   GetNextCorrelativoUseCase,
  //   GetStatusResumenUseCase,
  //   XmlBuilderResumenService,
  //   ResumenRepositoryImpl,
  // ],
  exports: [
    ResumenService,
    ResumenRepositoryImpl,
    CreateResumenUseCase,
    GetStatusResumenUseCase,
    ComprobanteModule
  ],
})
export class ResumenBoletasModule {}
