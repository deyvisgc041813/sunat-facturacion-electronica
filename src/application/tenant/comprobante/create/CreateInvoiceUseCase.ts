import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { Injectable } from '@nestjs/common';
import { XmlBuilderInvoiceService } from 'src/infrastructure/sunat/xml/xml-builder-invoice.service';
import { CreateInvoiceBaseUseCase } from '../base/CreateInvoiceBaseUseCase';
import { CatalogoRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/catalogo.repository.impl';
import { TributoTasaRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/tasa-tributo.repository.impl';
import { FindTasaByCodeUseCase } from 'src/application/parent/Tasa/FindTasaByCodeUseCase';
import { CreateInvoiceDto } from 'src/domain/tenant/comprobante/dto/invoice/create.invoice.dto';
import { ComprobanteService } from '../../../../domain/tenant/comprobante/services/comprobante.service';
import { SucursalService } from 'src/domain/parent/sucursal/service/sucursal.service';
@Injectable()
export class CreateInvoiceUseCase extends CreateInvoiceBaseUseCase {
  constructor(
    xmlInvoiceBuilder: XmlBuilderInvoiceService,
    firmaService: FirmaService,
    sunatService: SunatService,
    catalogoRepo: CatalogoRepositoryImpl,
    tributoRepo: TributoTasaRepositoryImpl,
    sucursalService: SucursalService,
    findTasaByCodeUseCase: FindTasaByCodeUseCase,
    comprobanteService :ComprobanteService
  ) {
    super(
      xmlInvoiceBuilder,
      firmaService,
      sunatService,
      sucursalService,
      catalogoRepo,
      tributoRepo,
      findTasaByCodeUseCase,
      comprobanteService
      
    );
  }
  protected buildXml(data: CreateInvoiceDto): string {
    return this.xmlInvoiceBuilder.buildXml(data);
  }
}
