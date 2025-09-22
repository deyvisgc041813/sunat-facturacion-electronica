
import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { EmpresaRepositoryImpl } from 'src/infrastructure/persistence/empresa/empresa.repository.impl';
import { ErrorLogRepositoryImpl } from 'src/infrastructure/persistence/error-log/error-log.repository.impl';
import {  CreateInvoiceDto } from 'src/domain/comprobante/dto/invoice/CreateInvoiceDto';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { Injectable } from '@nestjs/common';
import { XmlBuilderInvoiceService } from 'src/infrastructure/sunat/xml/xml-builder-invoice.service';
import { CreateInvoiceBaseUseCase } from '../base/CreateInvoiceBaseUseCase';
import { CreateComprobanteUseCase } from '../base/CreateComprobanteUseCase';
import { UpdateComprobanteUseCase } from '../update/UpdateComprobanteUseCase';
import { CatalogoRepositoryImpl } from 'src/infrastructure/persistence/catalogo/catalogo.repository.impl';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/sunat-log/sunat-log.repository.impl';
@Injectable()
export class CreateInvoiceUseCase extends CreateInvoiceBaseUseCase {
  constructor(
    xmlInvoiceBuilder: XmlBuilderInvoiceService,
    firmaService: FirmaService,
    sunatService: SunatService,
    empresaRepo: EmpresaRepositoryImpl,
    errorLogRepo: ErrorLogRepositoryImpl,
    useCreateCaseComprobante: CreateComprobanteUseCase,
    catalogoRepo: CatalogoRepositoryImpl,
    useUpdateCaseComprobante: UpdateComprobanteUseCase,
    sunatLogRepo: SunatLogRepositoryImpl,
    
  ) {
    super(xmlInvoiceBuilder, firmaService, sunatService, empresaRepo, errorLogRepo, useCreateCaseComprobante, catalogoRepo, useUpdateCaseComprobante, sunatLogRepo);
  }
  protected buildXml(data: CreateInvoiceDto): string {
    return this.xmlInvoiceBuilder.buildXml(data);
  }
}