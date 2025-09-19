import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { EmpresaRepositoryImpl } from 'src/infrastructure/database/repository/empresa.repository.impl';
import { ErrorLogRepositoryImpl } from 'src/infrastructure/database/repository/error-log.repository.impl';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { CreateComprobanteUseCase } from '../base/CreateComprobanteUseCase';
import { Injectable } from '@nestjs/common';
import { CatalogoRepositoryImpl } from 'src/infrastructure/database/repository/catalogo.repository.impl';
import { UpdateComprobanteUseCase } from '../update/UpdateComprobanteUseCase';
import { SunatLogRepositoryImpl } from 'src/infrastructure/database/repository/sunat-log.repository.impl';
import { XmlBuilderNotaCreditoService } from 'src/infrastructure/sunat/xml/xml-builder-nota-credito.service';
import { CreateNotaDto } from 'src/domain/comprobante/dto/notasComprobante/CreateNotaDto';
import { FindByEmpAndTipComAndSerieUseCase } from '../../Serie/FindByEmpAndTipComAndSerieUseCase';
import { GetByCorrelativoComprobantesUseCase } from '../query/GetByCorrelativoComprobantesUseCase';
import { FindTasaByCodeUseCase } from '../../Tasa/FindTasaByCodeUseCase';
import { CreateNotaCreditoBaseUseCase } from '../base/CreateNotaCreditoBaseUseCase';
import { ValidarAnulacionComprobanteUseCase } from '../validate/ValidarAnulacionComprobanteUseCase';
import { AnularComprobanteUseCase } from '../update/AnularComprobanteUseCase';
@Injectable()
export class CreateNotaCreditoUseCase extends CreateNotaCreditoBaseUseCase {
  constructor(
    xmlNCBuilder: XmlBuilderNotaCreditoService,
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
    findTasaByCodeUseCase: FindTasaByCodeUseCase,
    validarAnulacionComprobanteUseCase: ValidarAnulacionComprobanteUseCase,
    anularComprobanteUseCase: AnularComprobanteUseCase
  ) {
    super(
      xmlNCBuilder,
      firmaService,
      sunatService,
      empresaRepo,
      errorLogRepo,
      useCreateCaseComprobante,
      catalogoRepo,
      useUpdateCaseComprobante,
      sunatLogRepo,
      findSerieUseCase,
      findCorrelativoUseCase,
      findTasaByCodeUseCase,
      validarAnulacionComprobanteUseCase,
      anularComprobanteUseCase
    );
  }
  protected buildXml(data: CreateNotaDto): string {
    return this.xmlNCBuilder.buildXml(data);
  }
}
