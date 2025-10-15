import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { CreateComprobanteUseCase } from '../base/CreateComprobanteUseCase';
import { Injectable } from '@nestjs/common';
import { UpdateComprobanteUseCase } from '../update/UpdateComprobanteUseCase';
import { XmlBuilderNotaCreditoService } from 'src/infrastructure/sunat/xml/xml-builder-nota-credito.service';
import { GetByComprobanteAceptadoUseCase } from '../query/GetByComprobanteAceptadoUseCase';
import { CreateNotaCreditoBaseUseCase } from '../base/CreateNotaCreditoBaseUseCase';
import { ValidarAnulacionComprobanteUseCase } from '../validate/ValidarAnulacionComprobanteUseCase';
import { CatalogoRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/catalogo.repository.impl';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/auditoria/sunat-log.repository.impl';
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/sucursal.repository.impl';
import { FindCatalogosUseCase } from 'src/application/parent/catalogo/FindCatalogosUseCase';
import { GetBySucursalAndTipComAndSerieUseCase } from 'src/application/tenant/serie-comprobante/get-serie-by-sucursal-and-tipo-comprobante.usecase';
import { FindTasaByCodeUseCase } from 'src/application/parent/Tasa/FindTasaByCodeUseCase';
import { ComprobanteRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/comprobante/comprobante.repository.impl';
import { CreateNotaDto } from 'src/domain/tenant/comprobante/dto/notasComprobante/create.nota.dto';
import { ClienteService } from 'src/domain/parent/cliente/service/cliente.service';
@Injectable()
export class CreateNotaCreditoUseCase extends CreateNotaCreditoBaseUseCase {
  constructor(
    xmlNCBuilder: XmlBuilderNotaCreditoService,
    firmaService: FirmaService,
    sunatService: SunatService,
    useCreateCaseComprobante: CreateComprobanteUseCase,
    catalogoRepo: CatalogoRepositoryImpl,
    useUpdateCaseComprobante: UpdateComprobanteUseCase,
    sunatLogRepo: SunatLogRepositoryImpl,
    findSerieUseCase: GetBySucursalAndTipComAndSerieUseCase,
    findComprobanteAceptadoUseCase: GetByComprobanteAceptadoUseCase,
    findTasaByCodeUseCase: FindTasaByCodeUseCase,
    validarAnulacionComprobanteUseCase: ValidarAnulacionComprobanteUseCase,
    repoComprobante: ComprobanteRepositoryImpl,
    sucursalRepo: SucursalRepositoryImpl,
    findCatalogosUseCase: FindCatalogosUseCase,
    clienteService: ClienteService,
  ) {
    super(
      xmlNCBuilder,
      firmaService,
      sunatService,
      useCreateCaseComprobante,
      catalogoRepo,
      useUpdateCaseComprobante,
      sunatLogRepo,
      findSerieUseCase,
      findComprobanteAceptadoUseCase,
      findTasaByCodeUseCase,
      validarAnulacionComprobanteUseCase,
      repoComprobante,
      sucursalRepo,
      findCatalogosUseCase,
      clienteService
    );
  }
  protected buildXml(
    data: CreateNotaDto,
    tipoAfectacionGravadas: number[],
    tipoAfectacionExoneradas: number[],
    tipoAfectacionInafectas: number[],
  ): string {
    return this.xmlNCBuilder.buildXml(
      data,
      tipoAfectacionGravadas,
      tipoAfectacionExoneradas,
      tipoAfectacionInafectas,
    );
  }
}
