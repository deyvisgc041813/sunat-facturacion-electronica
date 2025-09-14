import { XmlBuilderService } from 'src/infrastructure/sunat/xml/xml-builder.service';
import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { EmpresaRepositoryImpl } from 'src/infrastructure/database/repository/empresa.repository.impl';
import { ErrorLogRepositoryImpl } from 'src/infrastructure/database/repository/error-log.repository.impl';
import {  CreateInvoiceDto } from 'src/domain/comprobante/dto/invoice/CreateInvoiceDto';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { CreateComprobanteBaseUseCase } from './base/CreateComprobanteBaseUseCase';
import { CreateComprobanteUseCase } from './base/CreateComprobanteUseCase';
import { Injectable } from '@nestjs/common';
import { CatalogoRepositoryImpl } from 'src/infrastructure/database/repository/catalogo.repository.impl';
import { UpdateComprobanteUseCase } from './base/UpdateComprobanteUseCase';
import { SunatLogRepositoryImpl } from 'src/infrastructure/database/repository/sunat-log.repository.impl';
@Injectable()
export class CreateInvoiceUseCase extends CreateComprobanteBaseUseCase {
  constructor(
    xmlBuilder: XmlBuilderService,
    firmaService: FirmaService,
    sunatService: SunatService,
    empresaRepo: EmpresaRepositoryImpl,
    errorLogRepo: ErrorLogRepositoryImpl,
    useCreateCaseComprobante: CreateComprobanteUseCase,
    catalogoRepo: CatalogoRepositoryImpl,
    useUpdateCaseComprobante: UpdateComprobanteUseCase,
    sunatLogRepo: SunatLogRepositoryImpl,
    
  ) {
    super(xmlBuilder, firmaService, sunatService, empresaRepo, errorLogRepo, useCreateCaseComprobante, catalogoRepo, useUpdateCaseComprobante, sunatLogRepo);
  }
  protected buildXml(data: CreateInvoiceDto): string {
    return this.xmlBuilder.buildInvoiceXml(data);
  }
}