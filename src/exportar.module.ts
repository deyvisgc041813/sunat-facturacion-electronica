import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresaOrmEntity } from './infrastructure/persistence/empresa/EmpresaOrmEntity';
import { ComprobanteOrmEntity } from './infrastructure/persistence/comprobante/ComprobanteOrmEntity';
import { CreatePdfUseCase } from './application/pdf/CreatePdfUseCase';
import { ExportarController } from './adapter/web/controller/exportar.controller';
import { ComprobanteRepositoryImpl } from './infrastructure/persistence/comprobante/comprobante.repository.impl';
import { PdfServiceImpl } from './infrastructure/adapter/PdfServiceImpl';
import { ClienteRepositoryImpl } from './infrastructure/persistence/cliente/cliente.repository.impl';
import { ClienteOrmEntity } from './infrastructure/persistence/cliente/ClienteOrmEntity';
import { SucursalRepositoryImpl } from './infrastructure/persistence/sucursal/sucursal.repository.impl';
import { ComprobanteRespuestaSunatOrmEntity } from './infrastructure/persistence/comprobante/ComprobanteRespuestaSunatOrmEntity';
import { SucursalOrmEntity } from './infrastructure/persistence/sucursal/SucursalOrmEntity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmpresaOrmEntity,
      ComprobanteOrmEntity,
      ClienteOrmEntity,
      ComprobanteRespuestaSunatOrmEntity,
      SucursalOrmEntity
    ]),
  ],
  controllers: [ExportarController],
  providers: [
    ComprobanteRepositoryImpl,
    PdfServiceImpl,
    CreatePdfUseCase,
    ClienteRepositoryImpl,
    SucursalRepositoryImpl
  ],
  exports: [
    CreatePdfUseCase
  ],
})
export class ExportarModule {}
