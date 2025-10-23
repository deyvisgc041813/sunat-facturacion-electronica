import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportarController } from './adapter/web/controller/tenant/exportar.controller';
import { ComprobantePdfBuilderImpl } from './infrastructure/adapter/PdfServiceImpl';
import { SucursalRepositoryImpl } from './infrastructure/persistence/parent/implement/sucursal.repository.impl';
import { ComprobanteOrmEntity } from './infrastructure/persistence/tenant/entity/comprobante/comprobante.orm.entity';
import { ClienteOrmEntity } from './infrastructure/persistence/parent/entity/cliente.orm.entity';
import { ComprobanteRespuestaSunatOrmEntity } from './infrastructure/persistence/tenant/entity/comprobante/conprobante-respuesta-sunat.orm.entity';
import { SucursalOrmEntity } from './infrastructure/persistence/parent/entity/sucursal.orm.entity';
import { ComprobanteRepositoryImpl } from './infrastructure/persistence/tenant/implement/comprobante/comprobante.repository.impl';
import { ClienteRepositoryImpl } from './infrastructure/persistence/parent/implement/cliente.repository.impl';
import { CreatePdfUseCase } from './application/tenant/pdf/CreatePdfUseCase';
import { TenantConeccionesModule } from './tenant-conecciones.module';
import { TenantContextModule } from './tenant-context.module';
import { ComprobanteModule } from './comprobante.module';
import { EmpresaOrmEntity } from './infrastructure/persistence/parent/entity/empresa/empesa.orm.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmpresaOrmEntity,
      ComprobanteOrmEntity,
      ClienteOrmEntity,
      ComprobanteRespuestaSunatOrmEntity,
      SucursalOrmEntity
    ]),
    TenantConeccionesModule,
    TenantContextModule,
    ComprobanteModule
  ],
  controllers: [ExportarController],
  providers: [
    ComprobanteRepositoryImpl,
    ComprobantePdfBuilderImpl,
    CreatePdfUseCase,
    ClienteRepositoryImpl,
    SucursalRepositoryImpl
  ],
  exports: [
    CreatePdfUseCase
  ],
})
export class ExportarModule {}
