import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResumenBoletasOrmEntity } from './infrastructure/persistence/tenant/entity/resumen/resumen-bp.orm.entity';
import { ResumenBoletasDetalleOrmEntity } from './infrastructure/persistence/tenant/entity/resumen/resumen-bp-detalle.orm.entity';
import { CatalogoModule } from './catalogo.module';
import { ComprobanteModule } from './comprobante.module';
import { XmlBuilderResumenService } from './infrastructure/sunat/xml/xml-builder-resumen.service';
import { EmpresaOrmEntity } from './infrastructure/persistence/parent/entity/empesa.orm.entity';
import { ComprobanteOrmEntity } from './infrastructure/persistence/tenant/entity/comprobante/comprobante.orm.entity';
import { ComprobanteRespuestaSunatOrmEntity } from './infrastructure/persistence/tenant/entity/comprobante/conprobante-respuesta-sunat.orm.entity';
import { SunatLogOrmEntity } from './infrastructure/persistence/tenant/entity/sunat-log.orm.entity';
import { ResumenRepositoryImpl } from './infrastructure/persistence/tenant/implement/resumen.repository';
import { ResumenController } from './adapter/web/controller/tenant/resumen.controller';
import { CreateResumenUseCase } from './application/tenant/resumen/create/CreateResumenUseCase';
import { GetNextCorrelativoUseCase } from './application/tenant/resumen/query/GetNextCorrelativoUseCase';
import { GetStatusResumenUseCase } from './application/tenant/resumen/query/GetStatusResumenUseCase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResumenBoletasOrmEntity,
      ResumenBoletasDetalleOrmEntity,
      EmpresaOrmEntity,
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
