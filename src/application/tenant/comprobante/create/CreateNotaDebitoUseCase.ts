import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { CreateComprobanteUseCase } from '../base/CreateComprobanteUseCase';
import { Injectable } from '@nestjs/common';
import { UpdateComprobanteUseCase } from '../update/UpdateComprobanteUseCase';
import { GetByComprobanteAceptadoUseCase } from '../query/GetByComprobanteAceptadoUseCase';

import { CreateNotaDebitoBaseUseCase } from '../base/CreateNotaDebitoBaseUseCase';
import { XmlBuilderNotaDebitoService } from 'src/infrastructure/sunat/xml/xml-builder-nota-debito.service';
import { CatalogoRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/catalogo.repository.impl';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/auditoria/sunat-log.repository.impl';
import { FindCatalogosUseCase } from 'src/application/parent/catalogo/FindCatalogosUseCase';
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/sucursal.repository.impl';
import { GetBySucursalAndTipComAndSerieUseCase } from 'src/application/tenant/serie-comprobante/get-serie-by-sucursal-and-tipo-comprobante.usecase';
import { FindTasaByCodeUseCase } from 'src/application/parent/Tasa/FindTasaByCodeUseCase';
import { CreateNotaDto } from 'src/domain/tenant/comprobante/dto/notasComprobante/create.nota.dto';
import { ClienteService } from 'src/domain/parent/cliente/service/cliente.service';
@Injectable()
export class CreateNotaDebitoUseCase extends CreateNotaDebitoBaseUseCase {
  constructor(
    protected readonly xmlNDBuilder: XmlBuilderNotaDebitoService,
    protected readonly firmaService: FirmaService,
    protected readonly sunatService: SunatService,
   protected readonly useCreateCaseComprobante: CreateComprobanteUseCase,
    protected readonly catalogoRepo: CatalogoRepositoryImpl,
    protected readonly useUpdateCaseComprobante: UpdateComprobanteUseCase,
    protected readonly sunatLogRepo: SunatLogRepositoryImpl,
    protected readonly findSerieUseCase: GetBySucursalAndTipComAndSerieUseCase,
    protected readonly findComprobanteAceptadoUseCase: GetByComprobanteAceptadoUseCase,
    protected readonly findTasaByCodeUseCase: FindTasaByCodeUseCase,
    protected readonly findCatalogosUseCase: FindCatalogosUseCase,
    protected readonly sucurSalRepo: SucursalRepositoryImpl,
     protected readonly clienteService: ClienteService,
  ) {
    super(
      xmlNDBuilder,
      firmaService,
      sunatService,
      useCreateCaseComprobante,
      catalogoRepo,
      useUpdateCaseComprobante,
      sunatLogRepo,
      findSerieUseCase,
      findComprobanteAceptadoUseCase,
      findTasaByCodeUseCase,
      findCatalogosUseCase,
      sucurSalRepo,
      clienteService
    );
  }
  protected buildXml(
    data: CreateNotaDto,
    tipoAfectacionGravadas: number[],
    tipoAfectacionExoneradas: number[],
    tipoAfectacionInafectas: number[],
  ): string {
    return this.xmlNDBuilder.buildXml(data, tipoAfectacionGravadas, tipoAfectacionExoneradas, tipoAfectacionInafectas);
  }
}
