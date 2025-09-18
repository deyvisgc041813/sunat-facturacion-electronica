
import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { EmpresaRepositoryImpl } from 'src/infrastructure/database/repository/empresa.repository.impl';
import { ErrorLogRepositoryImpl } from 'src/infrastructure/database/repository/error-log.repository.impl';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { CreateComprobanteUseCase } from '../base/CreateComprobanteUseCase';
import { Injectable } from '@nestjs/common';
import { CatalogoRepositoryImpl } from 'src/infrastructure/database/repository/catalogo.repository.impl';
import { UpdateComprobanteUseCase } from '../base/UpdateComprobanteUseCase';
import { SunatLogRepositoryImpl } from 'src/infrastructure/database/repository/sunat-log.repository.impl';
import { CreateNotaDto } from 'src/domain/comprobante/dto/notasComprobante/CreateNotaDto';
import { FindByEmpAndTipComAndSerieUseCase } from '../../Serie/FindByEmpAndTipComAndSerieUseCase';
import { GetByCorrelativoComprobantesUseCase } from '../query/GetByCorrelativoComprobantesUseCase';
import { FindTasaByCodeUseCase } from '../../Tasa/FindTasaByCodeUseCase';

import { CreateNotaDebitoBaseUseCase } from '../base/CreateNotaDebitoBaseUseCase';
import { XmlBuilderNotaDebitoService } from 'src/infrastructure/sunat/xml/xml-builder-nota-debito.service';
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