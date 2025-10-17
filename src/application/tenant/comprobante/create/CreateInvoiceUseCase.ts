import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { Injectable } from '@nestjs/common';
import { XmlBuilderInvoiceService } from 'src/infrastructure/sunat/xml/xml-builder-invoice.service';
import { CreateInvoiceBaseUseCase } from '../base/CreateInvoiceBaseUseCase';
import { CreateComprobanteUseCase } from '../base/CreateComprobanteUseCase';
import { UpdateComprobanteUseCase } from '../update/UpdateComprobanteUseCase';
import { CatalogoRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/catalogo.repository.impl';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/auditoria/sunat-log.repository.impl';
import { TributoTasaRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/tasa-tributo.repository.impl';
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/sucursal.repository.impl';
import { FindTasaByCodeUseCase } from 'src/application/parent/Tasa/FindTasaByCodeUseCase';
import { CreateInvoiceDto } from 'src/domain/tenant/comprobante/dto/invoice/create.invoice.dto';
import { SearchDocumentService } from '../services/search-document.service';
import { SucursalService } from 'src/domain/parent/sucursal/service/sucursal.service';
@Injectable()
export class CreateInvoiceUseCase extends CreateInvoiceBaseUseCase {
  constructor(
    xmlInvoiceBuilder: XmlBuilderInvoiceService,
    firmaService: FirmaService,
    sunatService: SunatService,
    useCreateCaseComprobante: CreateComprobanteUseCase,
    catalogoRepo: CatalogoRepositoryImpl,
    useUpdateCaseComprobante: UpdateComprobanteUseCase,
    sunatLogRepo: SunatLogRepositoryImpl,
    tributoRepo: TributoTasaRepositoryImpl,
    sucursalService: SucursalService,
    findTasaByCodeUseCase: FindTasaByCodeUseCase,
    searchDocument :SearchDocumentService
  ) {
    super(
      xmlInvoiceBuilder,
      firmaService,
      sunatService,
      sucursalService,
      useCreateCaseComprobante,
      catalogoRepo,
      useUpdateCaseComprobante,
      sunatLogRepo,
      tributoRepo,
      findTasaByCodeUseCase,
      searchDocument
      
    );
  }
  protected buildXml(data: CreateInvoiceDto): string {
    return this.xmlInvoiceBuilder.buildXml(data);
  }
}
