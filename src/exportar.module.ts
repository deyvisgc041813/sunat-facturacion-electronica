import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresaOrmEntity } from './infrastructure/persistence/empresa/EmpresaOrmEntity';
import { ComprobanteOrmEntity } from './infrastructure/persistence/comprobante/ComprobanteOrmEntity';
import { CreatePdfUseCase } from './application/pdf/CreatePdfUseCase';
import { ExportarController } from './adapter/web/controller/exportar.controller';
import { EmpresaRepositoryImpl } from './infrastructure/persistence/empresa/empresa.repository.impl';
import { ComprobanteRepositoryImpl } from './infrastructure/persistence/comprobante/comprobante.repository.impl';
import { PdfServiceImpl } from './infrastructure/adapter/PdfServiceImpl';
import { ClienteRepositoryImpl } from './infrastructure/persistence/cliente/cliente.repository.impl';
import { ClienteOrmEntity } from './infrastructure/persistence/cliente/ClienteOrmEntity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmpresaOrmEntity,
      ComprobanteOrmEntity,
      ClienteOrmEntity
    ]),
  ],
  controllers: [ExportarController],
  providers: [
    EmpresaRepositoryImpl,
    ComprobanteRepositoryImpl,
    PdfServiceImpl,
    CreatePdfUseCase,
    ClienteRepositoryImpl
  ],
  exports: [
    CreatePdfUseCase
  ],
})
export class ExportarModule {}
