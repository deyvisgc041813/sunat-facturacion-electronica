
import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { EmpresaRepositoryImpl } from 'src/infrastructure/persistence/empresa/empresa.repository.impl';
import { ErrorLogRepositoryImpl } from 'src/infrastructure/persistence/error-log/error-log.repository.impl';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { CreateComprobanteUseCase } from '../base/CreateComprobanteUseCase';
import { Injectable } from '@nestjs/common';
import { UpdateComprobanteUseCase } from '../update/UpdateComprobanteUseCase';
import { CreateNotaDto } from 'src/domain/comprobante/dto/notasComprobante/CreateNotaDto';
import { FindByEmpAndTipComAndSerieUseCase } from '../../Serie/FindByEmpAndTipComAndSerieUseCase';
import { GetByCorrelativoComprobantesUseCase } from '../query/GetByCorrelativoComprobantesUseCase';
import { FindTasaByCodeUseCase } from '../../Tasa/FindTasaByCodeUseCase';

import { CreateNotaDebitoBaseUseCase } from '../base/CreateNotaDebitoBaseUseCase';
import { XmlBuilderNotaDebitoService } from 'src/infrastructure/sunat/xml/xml-builder-nota-debito.service';
import { CatalogoRepositoryImpl } from 'src/infrastructure/persistence/catalogo/catalogo.repository.impl';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/sunat-log/sunat-log.repository.impl';
@Injectable()
export class CreateNotaDebitoUseCase extends CreateNotaDebitoBaseUseCase {
  constructor(
    xmlNDBuilder: XmlBuilderNotaDebitoService,
    firmaService: FirmaService,
    sunatService: SunatService,
    empresaRepo: EmpresaRepositoryImpl,
    errorLogRepo: ErrorLogRepositoryImpl,
    useCreateCaseComprobante: CreateComprobanteUseCase,
    catalogoRepo: CatalogoRepositoryImpl,
    useUpdateCaseComprobante: UpdateComprobanteUseCase,
    sunatLogRepo: SunatLogRepositoryImpl,
    findSerieUseCase: FindByEmpAndTipComAndSerieUseCase,
    findCorrelativoUseCase: GetByCorrelativoComprobantesUseCase,
    findTasaByCodeUseCase : FindTasaByCodeUseCase
  ) {
    super(xmlNDBuilder, firmaService, sunatService, empresaRepo, errorLogRepo, 
      useCreateCaseComprobante, catalogoRepo, useUpdateCaseComprobante,
      sunatLogRepo, findSerieUseCase, findCorrelativoUseCase, findTasaByCodeUseCase);
  }
  protected buildXml(data: CreateNotaDto): string {
    return this.xmlNDBuilder.buildXml(data);
  }
}