import { ErrorLogRepositoryImpl } from 'src/infrastructure/persistence/error-log/error-log.repository.impl';
import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { CreateComprobanteUseCase } from './CreateComprobanteUseCase';
import { ICreateComprobante } from 'src/domain/comprobante/interface/create.interface';
import { DateUtils } from 'src/util/date.util';
import { CryptoUtil } from 'src/util/CryptoUtil';
import { ZipUtil } from 'src/util/ZipUtil';
import { ErrorMapper } from 'src/domain/mapper/ErrorMapper';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CodigoProductoNotaDebito,
  CodigoSunatTasasEnum,
  LegendCodeEnum,
  NotaDebitoMotivo,
  ProcesoNotaCreditoEnum,
  TipoAumentoNotaDebito,
  TipoCatalogoEnum,
  TipoComprobanteEnum,
  TipoDocumentoIdentidadEnum,
  TipoDocumentoLetras,
} from 'src/util/catalogo.enum';
import { UpdateComprobanteUseCase } from '../update/UpdateComprobanteUseCase';
import { EstadoEnumComprobante } from 'src/util/estado.enum';
import { IResponseSunat } from 'src/domain/comprobante/interface/response.sunat.interface';
import {
  buildMensajeRecalculo,
  calcularMora,
  extraerHashCpe,
  identificarTipoAumentoNotaDebito,
  obtenerTiposAfectacion,
  setobjectUpdateComprobante,
  sonMontosCero,
  validarNumeroDocumentoCliente,
  validateCodigoProductoNotaDebito,
  validateLegends,
} from 'src/util/Helpers';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
import { CreateSunatLogDto } from 'src/domain/sunat-log/interface/sunat.log.interface';
import { CreateNotaDto } from 'src/domain/comprobante/dto/notasComprobante/CreateNotaDto';
import { FindByEmpAndTipComAndSerieUseCase } from 'src/application/Serie/FindByEmpAndTipComAndSerieUseCase';
import { GetByComprobanteAceptadoUseCase } from '../query/GetByComprobanteAceptadoUseCase';
import { DetailDto } from 'src/domain/comprobante/dto/base/DetailDto';
import { convertirMontoEnLetras } from 'src/util/conversion-numero-letra';
import { FindTasaByCodeUseCase } from 'src/application/Tasa/FindTasaByCodeUseCase';
import { ComprobanteResponseDto } from 'src/domain/comprobante/dto/ConprobanteResponseDto';
import { XmlBuilderNotaDebitoService } from 'src/infrastructure/sunat/xml/xml-builder-nota-debito.service';
import { CatalogoRepositoryImpl } from 'src/infrastructure/persistence/catalogo/catalogo.repository.impl';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/sunat-log/sunat-log.repository.impl';
import { FindCatalogosUseCase } from 'src/application/catalogo/FindCatalogosUseCase';
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/sucursal/sucursal.repository.impl';
import { SucursalResponseDto } from 'src/domain/sucursal/dto/SucursalResponseDto';
import { EmpresaInternaResponseDto } from 'src/domain/empresa/dto/EmpresaInternaResponseDto';
import { GetCertificadoDto } from 'src/domain/empresa/dto/GetCertificadoDto';
import { ComprobantesHelper } from 'src/util/comprobante-helpers';
import { validarTipoAfectacionNotaDebito } from 'src/util/notas-credito-debito.validator';
import { MAP_TRIBUTOS } from 'src/util/constantes';

export abstract class CreateNotaDebitoBaseUseCase {
  constructor(
    protected readonly xmlNDBuilder: XmlBuilderNotaDebitoService,
    protected readonly firmaService: FirmaService,
    protected readonly sunatService: SunatService,
    protected readonly errorLogRepo: ErrorLogRepositoryImpl,
    protected readonly useCreateComprobanteCase: CreateComprobanteUseCase,
    protected readonly catalogoRepo: CatalogoRepositoryImpl,
    protected readonly useUpdateCaseComprobante: UpdateComprobanteUseCase,
    protected readonly sunatLogRepo: SunatLogRepositoryImpl,
    protected readonly findSerieUseCase: FindByEmpAndTipComAndSerieUseCase,
    protected readonly findComprobanteAceptadoUseCase: GetByComprobanteAceptadoUseCase,
    protected readonly findTasaByCodeUseCase: FindTasaByCodeUseCase,
    protected readonly findCatalogosUseCase: FindCatalogosUseCase,
    protected readonly sucurSalRepo: SucursalRepositoryImpl,
  ) {}
  private readonly tiposCatalogos = [
    TipoCatalogoEnum.TIPO_AFECTACION,
    TipoCatalogoEnum.UNIDAD_MEDIDA,
  ];
  private readonly tasasVigentes = [MAP_TRIBUTOS.IGV.id, MAP_TRIBUTOS.MORA.id];
  protected abstract buildXml(
    data: any,
    tipoAfectacionGravadas: number[],
    tipoAfectacionExoneradas: number[],
    tipoAfectacionInafectas: number[],
  ): string;

  async execute(
    data: CreateNotaDto,
    empresaId: number,
    sucursalId: number,
  ): Promise<IResponseSunat> {
     ComprobantesHelper.validarDetallesGeneralesPorComprobante(data)
    const sucursal = await this.sucurSalRepo.findSucursalInterna(
      empresaId,
      sucursalId,
    );
    if (!sucursal) {
      throw new BadRequestException(
        `No se encontró ninguna sucursal asociada al identificador proporcionado (${sucursalId}). Verifique que el ID sea correcto.`,
      );
    }
    const empresa = await this.validarCatalogOyObtenerCertificado(
      data,
      sucursal,
    );

    let comprobanteId = 0;
    let xmlFirmadoError = '';
    try {
      const catalogos =
        (await this.findCatalogosUseCase.execute(this.tiposCatalogos)) ?? [];
      const tiposAfectacion = obtenerTiposAfectacion(catalogos);
      const tributosTasa =
        (await this.findTasaByCodeUseCase.execute(this.tasasVigentes)) ?? [];
      const tasaIgv = tributosTasa.get(CodigoSunatTasasEnum.IGV);
      data.porcentajeIgv = tasaIgv == null ? 0.18 : tasaIgv / 100;
      const tasaMora = tributosTasa.get(CodigoSunatTasasEnum.TASA_ANUAL_MORA);
      const tasaAnual = tasaMora == null ? 14.64 : tasaMora;
      const comprobanteOriginal = await this.obtenerComprobanteAceptado(
        data,
        sucursalId,
      );
      // 1. Validar cliente
      validarNumeroDocumentoCliente(
        TipoDocumentoLetras.NOTA_DEBITO,
        data.client.numDoc,
        comprobanteOriginal.cliente?.numeroDocumento ?? '',
      );
      const mtoCalculados: any = await this.buildDebitNoteAmountsJson(
        data,
        comprobanteOriginal,
        tasaAnual,
        tiposAfectacion?.tipoAfectacionGravada,
        tiposAfectacion?.tipoAfectacionExoneradas,
        tiposAfectacion?.tipoAfectacionInafectas,
      );
      data.mtoOperGravadas =
        mtoCalculados?.mtoOperGravadas ?? data.mtoOperGravadas;
      data.mtoOperExoneradas =
        mtoCalculados?.mtoOperExoneradas ?? data.mtoOperExoneradas;
      data.mtoOperInafectas =
        mtoCalculados?.mtoOperInafectas ?? data.mtoOperInafectas;
      data.mtoIGV = mtoCalculados?.mtoIGV ?? data.mtoIGV;
      data.subTotal = mtoCalculados?.subTotal ?? data.subTotal;
      data.mtoImpVenta = mtoCalculados?.mtoImpVenta ?? data.mtoImpVenta;
      if (mtoCalculados?.details && mtoCalculados.details.length > 0) {
        data.details = mtoCalculados.details;
      }
      data.legends = mtoCalculados?.legends ?? data.legends;
      const comprobante = await this.registrarComprobante(data, sucursalId);
      comprobanteId = comprobante.response?.comprobanteId ?? 0;
      data.correlativo = comprobante.response?.correlativo ?? data.correlativo;
      data.correoEmpresa = empresa?.correo ?? '';
      data.telefonoEmpresa = empresa?.telefono ?? "";
      data.signatureId = sucursal?.signatureId ?? '';
      data.signatureNote = sucursal?.signatureNote ?? '';
      data.codigoEstablecimientoSunat = sucursal?.codigoEstablecimientoSunat ?? '';

      // 2. Construir, firmar y comprimir XML
      const { xmlFirmado, fileName, zipBuffer } = await this.prepararXmlFirmado(
        data,
        empresa.certificadoDigital,
        empresa.claveCertificado,
        tiposAfectacion?.tipoAfectacionGravada,
        tiposAfectacion?.tipoAfectacionExoneradas,
        tiposAfectacion?.tipoAfectacionInafectas,
      );
      xmlFirmadoError = xmlFirmado;
      // 3. Enviar a SUNAT
      const usuarioSecundario = empresa?.usuarioSolSecundario ?? '';
      const claveSecundaria = CryptoUtil.decrypt(
        empresa.claveSolSecundario ?? '',
      );
      console.log(xmlFirmado)
      const responseSunat = await this.sunatService.sendBill(
        `${fileName}.zip`,
        zipBuffer,
        usuarioSecundario,
        claveSecundaria,
      );
      responseSunat.xmlFirmado = xmlFirmado;
      // 4. Actualizar comprobante con CDR, Hash y estado
      await this.actualizarComprobante(
        comprobanteId,
        sucursalId,
        data.tipoComprobante as TipoComprobanteEnum,
        xmlFirmado,
        responseSunat,
      );
      return responseSunat;
    } catch (error: any) {
      await this.procesarErrorSunat(
        error,
        data,
        comprobanteId,
        sucursalId,
        xmlFirmadoError,
      );
      throw error;
    }
  }

  private async validarCatalogOyObtenerCertificado(
    data: CreateNotaDto,
    sucursal: SucursalResponseDto,
  ) {
    const existCatalogo = await this.catalogoRepo.obtenerDetallePorCatalogo(
      TipoCatalogoEnum.TIPO_COMPROBANTE,
      data.tipoComprobante,
    );
    if (!existCatalogo) {
      throw new BadRequestException(
        `El tipo de comprobante ${data.tipoComprobante} no se encuentra en los catálogos de SUNAT`,
      );
    }
    const empresa = sucursal.empresa as EmpresaInternaResponseDto;
    if (!empresa?.certificadoDigital || !empresa?.claveCertificado) {
      throw new Error(
        `No se encontró certificado digital para la sucursal con RUC ${data.company.ruc}`,
      );
    }
    const certificado = new GetCertificadoDto(
      empresa.certificadoDigital,
      empresa.claveCertificado ?? '',
      empresa.usuarioSolSecundario ?? '',
      empresa.claveSolSecundario ?? '',
      empresa.email,
      empresa.telefono,
    );
    return certificado;
  }

  private async registrarComprobante(data: any, sucursalId: number) {
    const objComprobante: ICreateComprobante = {
      sucursalId,
      tipoComprobante: data.tipoComprobante as TipoComprobanteEnum,
      serie: data.serie,
      numeroDocumento: data.client.numDoc,
      tipoDocumento: data.client.tipoDoc as TipoDocumentoIdentidadEnum,
      fechaEmision: DateUtils.toMySQLDateTime(data.fechaEmision),
      moneda: data.tipoMoneda,
      totalGravado: data.mtoOperGravadas ?? 0,
      totalExonerado: data.mtoOperExoneradas ?? 0,
      totalInafecto: data.mtoOperInafectas ?? 0,
      totalIgv: data.mtoIGV ?? 0,
      mtoImpVenta: data.mtoImpVenta ?? 0,
      payloadJson: JSON.stringify(data),
    };
    return this.useCreateComprobanteCase.execute(objComprobante, data);
  }

  private async prepararXmlFirmado(
    data: any,
    certificadoDigital: any,
    claveCertificado: string,
    tipoAfectacionGravadas: number[],
    tipoAfectacionExoneradas: number[],
    tipoAfectacionInafectas: number[],
  ) {
    const passwordDecrypt = CryptoUtil.decrypt(claveCertificado);
    const xml = this.buildXml(
      data,
      tipoAfectacionGravadas,
      tipoAfectacionExoneradas,
      tipoAfectacionInafectas,
    );
    const xmlFirmado = await this.firmaService.firmarXml(
      xml,
      certificadoDigital,
      passwordDecrypt,
    );
    const fileName = `${data.company.ruc}-${data.tipoComprobante}-${data.serie}-${data.correlativo}`;
    const zipBuffer = await ZipUtil.createZip(fileName, xmlFirmado);
    return { xmlFirmado, fileName, zipBuffer };
  }

  private async actualizarComprobante(
    comprobanteId: number,
    sucursalId: number,
    tipoComprobante: TipoComprobanteEnum,
    xmlFirmado: string,
    responseSunat: IResponseSunat,
  ) {
    const hash = (await extraerHashCpe(xmlFirmado)) ?? '';
    const motivo = responseSunat?.observaciones
      ? JSON.stringify(responseSunat.observaciones)
      : null;

    const objectUpdate = setobjectUpdateComprobante(
      tipoComprobante,
      xmlFirmado,
      responseSunat.cdr,
      hash,
      responseSunat.estadoSunat,
      motivo ?? '',
    );
    await this.useUpdateCaseComprobante.execute(
      comprobanteId,
      sucursalId,
      objectUpdate,
    );
  }

  private async procesarErrorSunat(
    error: any,
    data: CreateNotaDto,
    comprobanteId: number,
    sucursalId: number,
    xmlFirmado: string,
  ) {
    const rspError = ErrorMapper.mapError(error, {
      sucursalId,
      tipo: data.tipoComprobante,
      serie: data.serie,
      correlativo: data.correlativo,
    });
    let responseSunat: IResponseSunat;
    if (rspError.tipoError === OrigenErrorEnum.SUNAT) {
      const obj = rspError.create as CreateSunatLogDto;
      obj.comprobanteId = comprobanteId;
      obj.request = JSON.stringify(data);
      obj.serie = `${data.serie}-${data.correlativo}`;
      obj.sucursalId = sucursalId;
      ((obj.intentos = 0), // esto cambiar cuando este ok
        (obj.usuarioEnvio = 'DEYVISGC')); // esto cambiar cuando este ok
      obj.fechaRespuesta = new Date();
      obj.fechaEnvio = new Date();
      await this.sunatLogRepo.save(obj);
      // 4. Actualizar comprobante con CDR, Hash y estado
      responseSunat = {
        mensaje: obj.response || 'Error SUNAT',
        estadoSunat:
          (obj.estado as EstadoEnumComprobante) ||
          EstadoEnumComprobante.RECHAZADO,
        status: false,
        observaciones: [obj.response ?? ''],
        xmlFirmado,
      };
    } else {
      //await this.errorLogRepo.save(rspError.create as CreateErrorLogDto);
      responseSunat = {
        mensaje: rspError.create.mensajeError || 'Error interno',
        estadoSunat: rspError.create.estado,
        codigoResponse: rspError.create.codigoError || 'ERR_SYSTEM',
        status: false,
        observaciones: [rspError.create.mensajeError ?? ''],
        xmlFirmado,
      };
    }
    if (comprobanteId > 0) {
      await this.actualizarComprobante(
        comprobanteId,
        sucursalId,
        data.tipoComprobante as TipoComprobanteEnum,
        xmlFirmado || '',
        responseSunat,
      );
    }
  }
  protected async buildDebitNoteAmountsJson(
    data: CreateNotaDto,
    comprobanteOriginal: ComprobanteResponseDto,
    tasaAnual: number,
    tipoAfectacionGravadas: number[],
    tipoAfectacionExoneradas: number[],
    tipoAfectacionInafectas: number[],
  ) {
    const esEntradaSinTotalesDev = sonMontosCero(
      data.mtoOperGravadas,
      data.mtoOperExoneradas,
      data.mtoOperInafectas,
      data.mtoIGV,
      data.mtoImpVenta,
    );
    switch (data.motivo.codigo) {
      case NotaDebitoMotivo.INTERECES_MORA:
        if (esEntradaSinTotalesDev) {
          // Modo simple: calular los montos
          return this.generarMontosNotaDebitoMora(
            data,
            comprobanteOriginal,
            comprobanteOriginal.fechaEmision,
            tasaAnual,
            tipoAfectacionGravadas,
            tipoAfectacionExoneradas,
            tipoAfectacionInafectas,
          );
        } else {
          // Modo calculado: ya se envian los montos calculados
          return this.validarNotaDebitoMora(
            data,
            comprobanteOriginal,
            new Date(data.fechaPago ?? new Date()),
            tasaAnual,
            tipoAfectacionGravadas,
            tipoAfectacionExoneradas,
            tipoAfectacionInafectas,
          );
        }
      case NotaDebitoMotivo.AUMENTO_VALOR:
        if (esEntradaSinTotalesDev) {
          // Modo simple: calular los montos
          return this.generarAumentoValor(
            data,
            comprobanteOriginal,
            tipoAfectacionGravadas,
            tipoAfectacionExoneradas,
            tipoAfectacionInafectas,
          );
        } else {
          // Modo calculado: ya se envian los montos calculados
          return this.validateNotaDebitoCalculadaAumentoValor(
            data,
            comprobanteOriginal,
            tipoAfectacionGravadas,
            tipoAfectacionExoneradas,
            tipoAfectacionInafectas,
          );
        }
      case NotaDebitoMotivo.PENALIDADES:
        if (esEntradaSinTotalesDev) {
          // Modo simple: calular los montos
          return this.generarPenalidad(
            data,
            comprobanteOriginal,
            tipoAfectacionGravadas,
            tipoAfectacionExoneradas,
            tipoAfectacionInafectas,
          );
        } else {
          // Modo calculado: ya se envian los montos calculados
          return this.validateNotaDebitoCalculadaPenalidad(
            data,
            comprobanteOriginal,
            tipoAfectacionGravadas,
            tipoAfectacionExoneradas,
            tipoAfectacionInafectas,
          );
        }
    }
  }
  async obtenerComprobanteAceptado(
    data: CreateNotaDto,
    sucursalId: number,
  ): Promise<ComprobanteResponseDto> {
    const numCorrelativoRelacionado = data?.documentoRelacionado?.correlativo;
    const tipCompRelacionado = data?.documentoRelacionado?.tipoComprobante;
    const serieRelacionado = data?.documentoRelacionado?.serie;
    const serie = await this.findSerieUseCase.execute(
      sucursalId,
      tipCompRelacionado,
      serieRelacionado,
    );
    if (!serie) {
      throw new BadRequestException(
        `El tipo de comprobante ${data.tipoComprobante} no se encuentra registrado en el sistema`,
      );
    }
    // 1. Buscar comprobante original
    const comprobante = await this.findComprobanteAceptadoUseCase.execute(
      sucursalId,
      numCorrelativoRelacionado,
      serie?.serieId,
    );
    if (!comprobante) {
      throw new NotFoundException(
        `No se encontró un comprobante asociado al documento relacionado con la serie ${serieRelacionado} y correlativo ${numCorrelativoRelacionado}.`,
      );
    }
    return comprobante;
  }

  /**
   * Reglas para Nota de Débito – Interés por Mora (cód. motivo 01):
   *
   * - Se debe agregar como detalle el nuevo ítem enviado en el JSON de entrada.
   * - La cabecera debe recalcularse considerando los montos del comprobante original
   *   más el nuevo ítem de interés por mora.
   */
  private generarMontosNotaDebitoMora(
    data: CreateNotaDto,
    comprobanteOriginal: ComprobanteResponseDto,
    fechaVencimiento: Date,
    tasaAnual: number,
    tipoAfectacionGravadas: number[],
    tipoAfectacionExoneradas: number[],
    tipoAfectacionInafectas: number[],
  ) {
    const detailsComprobanteOriginal = comprobanteOriginal?.payloadJson   ?.details as DetailDto[];
    validarTipoAfectacionNotaDebito(detailsComprobanteOriginal, data.details[0].tipAfeIgv);

    const totales = {
      mtoOperGravadas: 0,
      mtoOperExoneradas: 0,
      mtoOperInafectas: 0,
      mtoIGV: 0,
    };

    // Clonamos ítems originales del comprobante
    const detallesNotaDebito: DetailDto[] = [...detailsComprobanteOriginal];

    /**
     * 1. Calcular el monto pendiente sobre el cual se aplica la mora
     */
    const montoPendiente = detailsComprobanteOriginal.reduce(
      (sum, d) => sum + (d.mtoValorVenta ?? 0),
      0,
    );

    /**
     * 2. Calcular la mora usando tasa SUNAT o contractual
     */
    const fechaPago = new Date(data.fechaPago ?? new Date());

    const montoMora = calcularMora(
      montoPendiente,
      tasaAnual,
      fechaVencimiento,
      fechaPago,
    );

    /**
     * 3. Generar ítem de mora (si hay monto > 0),
     *    tomando la metadata de data.details
     */
    if (montoMora > 0) {
      const baseMora = data.details?.find(
        (d) => d.codProducto === CodigoProductoNotaDebito.INTERES_POR_MORA,
      );

      if (baseMora) {
        let igv = 0;
        let mtoBaseIgv = 0;
        let mtoValorVenta = montoMora;
        let mtoPrecioUnitario = montoMora;
        let porcentajeIgv = 0;
        if (tipoAfectacionGravadas.includes(baseMora.tipAfeIgv)) {
          mtoBaseIgv = montoMora;
          igv = +(montoMora * (baseMora.porcentajeIgv / 100)).toFixed(2);
          mtoPrecioUnitario = +(
            montoMora *
            (1 + baseMora.porcentajeIgv / 100)
          ).toFixed(2);
          porcentajeIgv = baseMora.porcentajeIgv;
        } else if (
          tipoAfectacionExoneradas.includes(baseMora.tipAfeIgv) ||
          tipoAfectacionInafectas.includes(baseMora.tipAfeIgv)
        ) {
          mtoBaseIgv = 0;
          igv = 0;
          mtoPrecioUnitario = montoMora;
        }
        const itemMora: DetailDto = {
          ...baseMora,
          cantidad: 1,
          mtoValorUnitario: montoMora,
          mtoBaseIgv,
          igv,
          totalImpuestos: igv,
          mtoValorVenta,
          mtoPrecioUnitario,
          porcentajeIgv,
        };
        detallesNotaDebito.push(itemMora);
      }
    }

    /**
     * 4. Agregar otros ítems adicionales enviados en data.details
     *    (ej. penalidades distintas al interés por mora)
     */
    for (const nuevo of data.details ?? []) {
      validateCodigoProductoNotaDebito(
        NotaDebitoMotivo.INTERECES_MORA,
        nuevo.codProducto,
      );
      // // Validar que el tipo de afectación de ND coincida con el de la factura original
      // if (nuevo.tipAfeIgv !== tipAfeigv) {
      //   throw new BadRequestException(
      //     `El tipo de afectación IGV del ítem ${nuevo.codProducto} (${nuevo.tipAfeIgv}) no coincide con el de la factura original (${tipAfeigv}). 
      //      La Nota de Débito por Mora debe mantener la misma naturaleza tributaria que el comprobante original.`,
      //   );
      // }

      // Evitar duplicar el ítem de mora (ya se calculó en el bloque anterior)
      if (nuevo.codProducto === CodigoProductoNotaDebito.INTERES_POR_MORA)
        continue;

      if (tipoAfectacionGravadas.includes(nuevo.tipAfeIgv)) {
        nuevo.mtoBaseIgv = nuevo.mtoValorUnitario * nuevo.cantidad;
        nuevo.igv = +(nuevo.mtoBaseIgv * (nuevo.porcentajeIgv / 100)).toFixed(
          2,
        );
        nuevo.totalImpuestos = nuevo.igv;
        nuevo.mtoValorVenta = nuevo.mtoBaseIgv;
        nuevo.mtoPrecioUnitario = +(
          nuevo.mtoValorUnitario *
          (1 + nuevo.porcentajeIgv / 100)
        ).toFixed(2);
      } else {
        nuevo.mtoBaseIgv = 0;
        nuevo.igv = 0;
        nuevo.totalImpuestos = 0;
        nuevo.porcentajeIgv = 0;
        nuevo.mtoValorVenta = nuevo.mtoValorUnitario * nuevo.cantidad;
        nuevo.mtoPrecioUnitario = nuevo.mtoValorUnitario;
      }

      detallesNotaDebito.push(nuevo);
    }
    /**
     * 5. Recalcular totales globales
     */
    for (const d of detallesNotaDebito) {
      if (tipoAfectacionGravadas.includes(d.tipAfeIgv)) {
        totales.mtoOperGravadas += d.mtoBaseIgv ?? 0;
        totales.mtoIGV += d.igv ?? 0;
      } else if (tipoAfectacionExoneradas.includes(d.tipAfeIgv)) {
        totales.mtoOperExoneradas += d.mtoValorVenta ?? 0;
      } else if (tipoAfectacionInafectas.includes(d.tipAfeIgv)) {
        totales.mtoOperInafectas += d.mtoValorVenta ?? 0;
      }
    }

    const subTotal =
      totales.mtoOperGravadas +
      totales.mtoOperExoneradas +
      totales.mtoOperInafectas;
    const mtoImpVenta = subTotal + totales.mtoIGV;

    const legends = [
      {
        code: LegendCodeEnum.MONTO_EN_LETRAS,
        value: convertirMontoEnLetras(mtoImpVenta),
      },
    ];

    return {
      ...totales,
      subTotal,
      mtoImpVenta,
      details: detallesNotaDebito, // originales + mora + otros ítems
      legends,
      origen: ProcesoNotaCreditoEnum.GENERADA_DESDE_DATOS_SIMPLES,
    };
  }

  private validarNotaDebitoMora(
    data: CreateNotaDto,
    comprobante: ComprobanteResponseDto,
    fechaPago: Date,
    tasaAnual: number,
    tipoAfectacionGravadas: number[],
    tipoAfectacionExoneradas: number[],
    tipoAfectacionInafectas: number[],
  ): boolean {
    const original = comprobante.payloadJson;

    // 1. Calcular monto pendiente (base del original)
    const montoPendiente =
      (original.mtoOperGravadas ?? 0) +
      (original.mtoOperExoneradas ?? 0) +
      (original.mtoOperInafectas ?? 0);

    // 2. Calcular mora esperada
    const fechaVencimiento = new Date(original?.fechaEmision);
    const montoMora = calcularMora(
      montoPendiente,
      tasaAnual,
      fechaVencimiento,
      fechaPago,
    );

    // 3. Determinar el tipo de afectación único del comprobante
    const tipAfeigv = validarTipoAfectacionNotaDebito(original.details, data.details[0].tipAfeIgv);

    // 4. Inicializar valores esperados
    let mtoOperGravadasEsperado = original.mtoOperGravadas ?? 0;
    let mtoOperExoneradasEsperado = original.mtoOperExoneradas ?? 0;
    let mtoOperInafectasEsperado = original.mtoOperInafectas ?? 0;
    let mtoIGVEsperado = original.mtoIGV ?? 0;

    let igvMora = 0;

    // 5. Sumar la mora en la categoría correspondiente
    if (tipoAfectacionGravadas.includes(tipAfeigv)) {
      igvMora = +(montoMora * data.porcentajeIgv).toFixed(2);
      mtoOperGravadasEsperado += montoMora;
      mtoIGVEsperado += igvMora;
    } else if (tipoAfectacionExoneradas.includes(tipAfeigv)) {
      mtoOperExoneradasEsperado += montoMora;
    } else if (tipoAfectacionInafectas.includes(tipAfeigv)) {
      mtoOperInafectasEsperado += montoMora;
    }

    const subTotalEsperado =
      mtoOperGravadasEsperado +
      mtoOperExoneradasEsperado +
      mtoOperInafectasEsperado;

    const mtoImpVentaEsperado = subTotalEsperado + mtoIGVEsperado;

    // 6. Validar ítems
    for (const d of data.details) {
      const existeEnOriginal = original.details.find(
        (o) => o.codProducto === d.codProducto,
      );

      if (existeEnOriginal) {
        if (d.unidad !== existeEnOriginal.unidad) {
          throw new BadRequestException(
            `El ítem ${d.codProducto} no puede cambiar de unidad (${d.unidad} vs ${existeEnOriginal.unidad})`,
          );
        }
      } else {
        validateCodigoProductoNotaDebito(
          NotaDebitoMotivo.INTERECES_MORA,
          d.codProducto,
        );
        // Validar cálculo del ítem de mora
        if (d.mtoValorUnitario !== montoMora) {
          throw new BadRequestException(
            `El ítem de mora está mal calculado.  Esperado: Valor ${montoMora}, Recibido: Valor ${d.mtoValorUnitario}. 
             ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
          );
        }

        // Solo validar IGV si la factura original es gravada
        if (tipoAfectacionGravadas.includes(tipAfeigv)) {
          if (d.igv !== igvMora) {
            throw new BadRequestException(
              `El ítem de mora está mal calculado en IGV.   Esperado: ${igvMora}, Recibido: ${d.igv}. 
                ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
            );
          }
        } else {
          if (d.igv !== 0) {
            throw new BadRequestException(
              `El ítem de mora no debe tener IGV porque el comprobante original es ${tipAfeigv}. 
              Se recibió IGV ${d.igv} en lugar de 0. 
              ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
            );
          }
        }
      }
    }

    // 7. Validaciones de totales
    if (data.mtoOperGravadas !== mtoOperGravadasEsperado) {
      throw new BadRequestException(
        `El monto gravado (${data.mtoOperGravadas}) no coincide con el esperado (${mtoOperGravadasEsperado}). 
       ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
      );
    }

    if (data.mtoIGV !== mtoIGVEsperado) {
      throw new BadRequestException(
        `El IGV (${data.mtoIGV}) no coincide con el esperado (${mtoIGVEsperado}). 
       ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
      );
    }

    if (data.mtoOperExoneradas !== mtoOperExoneradasEsperado) {
      throw new BadRequestException(
        `El monto exonerado (${data.mtoOperExoneradas}) no coincide con el esperado (${mtoOperExoneradasEsperado}). 
       ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
      );
    }

    if (data.mtoOperInafectas !== mtoOperInafectasEsperado) {
      throw new BadRequestException(
        `El monto inafecto (${data.mtoOperInafectas}) no coincide con el esperado (${mtoOperInafectasEsperado}). 
       ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
      );
    }

    if (data.subTotal !== subTotalEsperado) {
      throw new BadRequestException(
        `El subTotal (${data.subTotal}) no coincide con el esperado (${subTotalEsperado}). 
       ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
      );
    }

    if (data.mtoImpVenta !== mtoImpVentaEsperado) {
      throw new BadRequestException(
        `El total de la venta (${data.mtoImpVenta}) no coincide con el esperado (${mtoImpVentaEsperado}). 
       ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
      );
    }

    // 8. Validar leyendas
    validateLegends(data.legends, mtoImpVentaEsperado);

    return true;
  }

  /**
   * Reglas para Nota de Débito – Aumento de Valor (cód. motivo 02):
   *
   * Se debe enviar únicamente el ítem del aumento como detalle de la nota.
   *
   * Casos:
   * 1. Aumento Global:
   *    - El cliente envía un ítem de aumento aplicable a toda la operación.
   *    - El código de producto del ítem debe ser 'AU001' (definido por SUNAT).
   *    - La cabecera se debe recalcular considerando solo este ítem.
   *
   * 2. Aumento por Ítem:
   *    - El aumento aplica a un producto ya existente en el comprobante original.
   *    - El ítem enviado debe corresponder a un 'codProducto' válido del comprobante original.
   *    - La cabecera se debe recalcular considerando únicamente este ítem de aumento.
   */

  private generarAumentoValor(
    data: CreateNotaDto,
    comprobanteOriginal: ComprobanteResponseDto,
    tipoAfectacionGravadas: number[],
    tipoAfectacionExoneradas: number[],
    tipoAfectacionInafectas: number[],
  ) {
    const totales = {
      mtoOperGravadas: 0,
      mtoOperExoneradas: 0,
      mtoOperInafectas: 0,
      mtoIGV: 0,
    };
    const detailsComprobante = comprobanteOriginal?.payloadJson
      ?.details as DetailDto[];

    const tipoAumento = identificarTipoAumentoNotaDebito(
      detailsComprobante,
      data.details,
    );

    // Lista de detalles recalculados
    const detallesCalculados: DetailDto[] = [];
    if (tipoAumento === TipoAumentoNotaDebito.GLOBAL) {
      for (const d of data.details) {
        // Penalidad = siempre nuevo ítem (PEN001) enviado por el cliente
        validateCodigoProductoNotaDebito(
          NotaDebitoMotivo.AUMENTO_VALOR,
          d.codProducto,
        );
        // Cálculo de IGV a nivel de detalle
        const base = d.mtoValorUnitario ?? 0;
        const igv = tipoAfectacionGravadas.includes(d.tipAfeIgv)
          ? +(base * (d.porcentajeIgv / 100)).toFixed(2)
          : 0;
        const porcentajeIgv = tipoAfectacionGravadas.includes(d.tipAfeIgv)
          ? d.porcentajeIgv
          : 0;
        const valorVenta = base;
        const precioUnitario = base + igv;
        // Recalculo del detalle
        const detalleCalculado: DetailDto = {
          ...d,
          mtoBaseIgv: base,
          igv,
          totalImpuestos: igv,
          mtoValorVenta: valorVenta,
          mtoPrecioUnitario: precioUnitario,
          porcentajeIgv,
        };
        detallesCalculados.push(detalleCalculado);
        // Acumular totales
        if (tipoAfectacionGravadas.includes(d.tipAfeIgv)) {
          totales.mtoOperGravadas += base;
          totales.mtoIGV += igv;
        } else if (tipoAfectacionExoneradas.includes(d.tipAfeIgv)) {
          totales.mtoOperExoneradas += valorVenta;
        } else if (tipoAfectacionInafectas.includes(d.tipAfeIgv)) {
          totales.mtoOperInafectas += valorVenta;
        }
      }
    } else if (tipoAumento === TipoAumentoNotaDebito.ITEM) {
      for (const d of data.details) {
        // Validar que el item exista en el comprobante original
        const existeEnFactura = detailsComprobante.some(
          (dc) => dc.codProducto === d.codProducto,
        );
        if (!existeEnFactura) {
          throw new BadRequestException(
            `El producto ${d.codProducto} no existe en la factura original`,
          );
        }

        // Cálculo igual que en global
        const base = d.mtoValorUnitario ?? 0;
        const igv = tipoAfectacionGravadas.includes(d.tipAfeIgv)
          ? +(base * (d.porcentajeIgv / 100)).toFixed(2)
          : 0;
        const valorVenta = base;
        const precioUnitario = base + igv;
        const porcentajeIgv = tipoAfectacionGravadas.includes(d.tipAfeIgv)
          ? d.porcentajeIgv
          : 0;
        const detalleCalculado: DetailDto = {
          ...d,
          mtoBaseIgv: base,
          igv,
          totalImpuestos: igv,
          mtoValorVenta: valorVenta,
          mtoPrecioUnitario: precioUnitario,
          porcentajeIgv,
        };
        detallesCalculados.push(detalleCalculado);

        // Acumular totales
        if (tipoAfectacionGravadas.includes(d.tipAfeIgv)) {
          totales.mtoOperGravadas += base;
          totales.mtoIGV += igv;
        } else if (tipoAfectacionExoneradas.includes(d.tipAfeIgv)) {
          totales.mtoOperExoneradas += valorVenta;
        } else if (tipoAfectacionInafectas.includes(d.tipAfeIgv)) {
          totales.mtoOperInafectas += valorVenta;
        }
      }
    }

    // Totales cabecera
    const subTotal =
      totales.mtoOperGravadas +
      totales.mtoOperExoneradas +
      totales.mtoOperInafectas;
    const mtoImpVenta = subTotal + totales.mtoIGV;

    const legends = [
      {
        code: LegendCodeEnum.MONTO_EN_LETRAS,
        value: convertirMontoEnLetras(mtoImpVenta),
      },
    ];
    return {
      ...totales,
      subTotal,
      mtoImpVenta,
      details: detallesCalculados,
      legends,
      origen: ProcesoNotaCreditoEnum.GENERADA_DESDE_DATOS_SIMPLES,
    };
  }
  private validateNotaDebitoCalculadaAumentoValor(
    data: CreateNotaDto,
    comprobanteOriginal: ComprobanteResponseDto,
    tipoAfectacionGravadas: number[],
    tipoAfectacionExoneradas: number[],
    tipoAfectacionInafectas: number[],
  ): boolean {
    // 1. Validar totales de cabecera
    const subTotalEsperado =
      (data.mtoOperGravadas ?? 0) +
      (data.mtoOperExoneradas ?? 0) +
      (data.mtoOperInafectas ?? 0);

    if (subTotalEsperado !== data.subTotal) {
      throw new BadRequestException(
        `El subTotal ${data.subTotal} no coincide con la suma esperada ${subTotalEsperado}. 
      ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
      );
    }

    const mtoImpVentaEsperado = subTotalEsperado + (data.mtoIGV ?? 0);

    if (mtoImpVentaEsperado !== data.mtoImpVenta) {
      throw new BadRequestException(
        `El total de la venta ${data.mtoImpVenta} no coincide con la suma esperada ${mtoImpVentaEsperado}. 
      ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
      );
    }

    // 2.1 Validación de cabecera: coherencia entre afectaciones
    const tieneGravadas = (data.mtoOperGravadas ?? 0) > 0;
    const tieneExoneradas = (data.mtoOperExoneradas ?? 0) > 0;
    const tieneInafectas = (data.mtoOperInafectas ?? 0) > 0;

    if (tieneGravadas) {
      if (
        (data.mtoOperExoneradas ?? 0) > 0 ||
        (data.mtoOperInafectas ?? 0) > 0
      ) {
        throw new BadRequestException(
          `Cuando existe monto gravado, los montos exonerados e inafectos deben ser cero.`,
        );
      }
    }

    if (tieneExoneradas) {
      if ((data.mtoOperGravadas ?? 0) > 0 || (data.mtoOperInafectas ?? 0) > 0) {
        throw new BadRequestException(
          `Cuando existe monto exonerado, los montos gravados e inafectos deben ser cero.`,
        );
      }
    }

    if (tieneInafectas) {
      if (
        (data.mtoOperGravadas ?? 0) > 0 ||
        (data.mtoOperExoneradas ?? 0) > 0
      ) {
        throw new BadRequestException(
          `Cuando existe monto inafecto, los montos gravados y exonerados deben ser cero.`,
        );
      }
    }

    // 2.2 Validaciones especiales para aumento global (AU001)
    const detallesGlobal = data.details.filter(
      (d) => d.codProducto === CodigoProductoNotaDebito.AJUSTE_GLOBAL_OPERACION,
    );

    if (detallesGlobal.length > 1) {
      throw new BadRequestException(
        `Para un aumento global (AU001) solo debe existir un ítem en el detalle.`,
      );
    }

    if (detallesGlobal.length === 1) {
      const cantidadAfectaciones = [
        tieneGravadas,
        tieneExoneradas,
        tieneInafectas,
      ].filter(Boolean).length;
      if (cantidadAfectaciones !== 1) {
        throw new BadRequestException(
          `En un aumento global (AU001) solo puede existir un tipo de afectación (gravada, exonerada o inafecta).`,
        );
      }
    }

    // 3. Validar detalles
    for (const d of data.details) {
      const base = d.mtoBaseIgv ?? 0;
      const igvEsperado = tipoAfectacionGravadas.includes(d.tipAfeIgv)
        ? +(base * (d.porcentajeIgv / 100)).toFixed(2)
        : 0;
      // 4. Validar escenario: por ítem vs global

      const itemFactura = comprobanteOriginal?.payloadJson?.details.find(
        (f) => f.codProducto === d.codProducto,
      );

      if (
        !itemFactura &&
        d.codProducto !== CodigoProductoNotaDebito.AJUSTE_GLOBAL_OPERACION
      ) {
        throw new BadRequestException(
          `El producto ${d.codProducto} no existe en la factura original ni corresponde a un ajuste global.`,
        );
      }

      // Validar que el tipo de afectación coincida
      if (itemFactura && itemFactura.tipAfeIgv !== d.tipAfeIgv) {
        throw new BadRequestException(
          `El item ${d.codProducto} tiene un tipo de afectación distinto al de la factura original. 
          Original: ${itemFactura.tipAfeIgv}, ND: ${d.tipAfeIgv}.`,
        );
      }
      // 3.1 Validar IGV según tipo de afectación
      if (tipoAfectacionGravadas.includes(d.tipAfeIgv)) {
        if (igvEsperado !== d.igv) {
          throw new BadRequestException(
            `El IGV del item ${d.codProducto} no es correcto. Esperado ${igvEsperado}, recibido ${d.igv}. 
          ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
          );
        }
      } else {
        if ((d.igv ?? 0) !== 0) {
          throw new BadRequestException(
            `El IGV del item ${d.codProducto} debe ser 0 porque su afectación (${d.tipAfeIgv}) no está gravada. Recibido ${d.igv}.`,
          );
        }
      }
      // 3.2 Validar totalImpuestos
      if (d.totalImpuestos !== igvEsperado) {
        throw new BadRequestException(`El total de impuestos del item ${d.codProducto} no es correcto. Esperado ${igvEsperado}, recibido ${d.totalImpuestos}. 
            ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`);
      }

      const valorVentaEsperado = +(d.mtoValorUnitario * d.cantidad).toFixed(2);

      if (valorVentaEsperado !== d.mtoValorVenta) {
        throw new BadRequestException(
          `El valor de venta del item ${d.codProducto} no es correcto. Esperado ${valorVentaEsperado}, recibido ${d.mtoValorVenta}. 
         ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
        );
      }

      const precioUnitarioEsperado = +(
        d.mtoValorUnitario +
        igvEsperado / (d.cantidad || 1)
      ).toFixed(2);

      if (precioUnitarioEsperado !== d.mtoPrecioUnitario) {
        throw new BadRequestException(
          `El precio unitario del item ${d.codProducto} no es correcto. Esperado ${precioUnitarioEsperado}, recibido ${d.mtoPrecioUnitario}. 
        ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
        );
      }

      // 3.2 Validar coherencia entre detalle y cabecera
      if (tipoAfectacionGravadas.includes(d.tipAfeIgv)) {
        if (
          (data.mtoOperExoneradas ?? 0) > 0 ||
          (data.mtoOperInafectas ?? 0) > 0
        ) {
          throw new BadRequestException(
            `El item ${d.codProducto} es GRAVADO (tipAfeIgv ${d.tipAfeIgv}), pero en la cabecera se reportan montos exonerados o inafectos.`,
          );
        }
      }

      if (tipoAfectacionExoneradas.includes(d.tipAfeIgv)) {
        if (
          (data.mtoOperGravadas ?? 0) > 0 ||
          (data.mtoOperInafectas ?? 0) > 0
        ) {
          throw new BadRequestException(
            `El item ${d.codProducto} es EXONERADO (tipAfeIgv ${d.tipAfeIgv}), pero en la cabecera se reportan montos gravados o inafectos.`,
          );
        }
      }

      if (tipoAfectacionInafectas.includes(d.tipAfeIgv)) {
        if (
          (data.mtoOperGravadas ?? 0) > 0 ||
          (data.mtoOperExoneradas ?? 0) > 0
        ) {
          throw new BadRequestException(
            `El item ${d.codProducto} es INAFECTO (tipAfeIgv ${d.tipAfeIgv}), pero en la cabecera se reportan montos gravados o exonerados.`,
          );
        }
      }

      // 4. Validar escenario: por ítem vs global
      const existeEnFactura = comprobanteOriginal?.payloadJson?.details.some(
        (f) => f.codProducto === d.codProducto,
      );

      if (
        !existeEnFactura &&
        d.codProducto !== CodigoProductoNotaDebito.AJUSTE_GLOBAL_OPERACION
      ) {
        throw new BadRequestException(
          `El producto ${d.codProducto} no existe en la factura original ni corresponde a un ajuste global.`,
        );
      }
    }

    // 5. Validar legends (monto en letras obligatorio)
    validateLegends(data.legends, mtoImpVentaEsperado);

    // 6. Validar que la cabecera coincida con la suma de los detalles (para ítem)
    let totalGravadas = 0;
    let totalExoneradas = 0;
    let totalInafectas = 0;
    let totalIgv = 0;

    for (const d of data.details) {
      if (tipoAfectacionGravadas.includes(d.tipAfeIgv)) {
        totalGravadas += d.mtoBaseIgv ?? 0;
        totalIgv += d.igv ?? 0;
      } else if (tipoAfectacionExoneradas.includes(d.tipAfeIgv)) {
        totalExoneradas += d.mtoValorVenta ?? 0;
      } else if (tipoAfectacionInafectas.includes(d.tipAfeIgv)) {
        totalInafectas += d.mtoValorVenta ?? 0;
      }
    }

    const subTotalDetalles = totalGravadas + totalExoneradas + totalInafectas;
    const mtoImpVentaDetalles = subTotalDetalles + totalIgv;

    if (data.mtoOperGravadas !== totalGravadas) {
      throw new BadRequestException(
        `El monto de operaciones gravadas en cabecera (${data.mtoOperGravadas}) no coincide con la suma de los detalles (${totalGravadas}).`,
      );
    }

    if (data.mtoOperExoneradas !== totalExoneradas) {
      throw new BadRequestException(
        `El monto de operaciones exoneradas en cabecera (${data.mtoOperExoneradas}) no coincide con la suma de los detalles (${totalExoneradas}).`,
      );
    }

    if (data.mtoOperInafectas !== totalInafectas) {
      throw new BadRequestException(
        `El monto de operaciones inafectas en cabecera (${data.mtoOperInafectas}) no coincide con la suma de los detalles (${totalInafectas}).`,
      );
    }

    if (data.mtoIGV !== totalIgv) {
      throw new BadRequestException(
        `El IGV en cabecera (${data.mtoIGV}) no coincide con la suma de los detalles (${totalIgv}).`,
      );
    }

    if (data.subTotal !== subTotalDetalles) {
      throw new BadRequestException(
        `El SubTotal en cabecera (${data.subTotal}) no coincide con la suma de los detalles (${subTotalDetalles}).`,
      );
    }

    if (data.mtoImpVenta !== mtoImpVentaDetalles) {
      throw new BadRequestException(
        `El total de la venta en cabecera (${data.mtoImpVenta}) no coincide con la suma de los detalles (${mtoImpVentaDetalles}).`,
      );
    }

    return true;
  }

  /**
   * Reglas para Nota de Débito – Penalidades (cód. motivo 03):
   *
   * - Se debe agregar en el detalle únicamente el ítem correspondiente a la penalidad.
   * - El ítem debe enviarse con la información proporcionada por el cliente.
   * - La cabecera se debe recalcular considerando el nuevo ítem de penalidad.
   */
  private generarPenalidad(
    data: CreateNotaDto, // datos de entrada (mensaje simple)
    comprobanteOriginal: ComprobanteResponseDto,
    tipoAfectacionGravadas: number[],
    tipoAfectacionExoneradas: number[],
    tipoAfectacionInafectas: number[],
  ): {
    mtoOperGravadas: number;
    mtoOperExoneradas: number;
    mtoOperInafectas: number;
    mtoIGV: number;
    subTotal: number;
    mtoImpVenta: number;
    details: DetailDto[];
    legends: { code: string; value: string }[];
    origen: ProcesoNotaCreditoEnum;
  } {
    const totales = {
      mtoOperGravadas: 0,
      mtoOperExoneradas: 0,
      mtoOperInafectas: 0,
      mtoIGV: 0,
    };
    const detallesCalculados: DetailDto[] = [];
    for (const d of data.details) {
      // Penalidad = siempre nuevo ítem (PEN001) enviado por el cliente
      validateCodigoProductoNotaDebito(
        NotaDebitoMotivo.PENALIDADES,
        d.codProducto,
      );
      this.validarTipoAfectacionPenalidad(
        comprobanteOriginal,
        d.tipAfeIgv,
        tipoAfectacionGravadas,
        tipoAfectacionExoneradas,
        tipoAfectacionInafectas,
      );
      const base = d.mtoValorUnitario ?? 0;

      // IGV solo si está en afectación gravada
      const igv = tipoAfectacionGravadas.includes(d.tipAfeIgv)
        ? +(base * (d.porcentajeIgv / 100)).toFixed(2)
        : 0;
      const porcentajeIgv = tipoAfectacionGravadas.includes(d.tipAfeIgv)
        ? d.porcentajeIgv
        : 0;
      const valorVenta = base;
      const precioUnitario = base + igv;

      const detalleCalculado: DetailDto = {
        ...d,
        mtoBaseIgv: base,
        igv,
        totalImpuestos: igv,
        mtoValorVenta: valorVenta,
        mtoPrecioUnitario: precioUnitario,
        porcentajeIgv,
      };

      detallesCalculados.push(detalleCalculado);

      // Acumular totales
      if (tipoAfectacionGravadas.includes(d.tipAfeIgv)) {
        totales.mtoOperGravadas += base;
        totales.mtoIGV += igv;
      } else if (tipoAfectacionExoneradas.includes(d.tipAfeIgv)) {
        totales.mtoOperExoneradas += valorVenta;
      } else if (tipoAfectacionInafectas.includes(d.tipAfeIgv)) {
        totales.mtoOperInafectas += valorVenta;
      }
    }

    // Totales cabecera
    const subTotal =
      totales.mtoOperGravadas +
      totales.mtoOperExoneradas +
      totales.mtoOperInafectas;
    const mtoImpVenta = subTotal + totales.mtoIGV;

    // Leyenda obligatoria
    const legends = [
      {
        code: LegendCodeEnum.MONTO_EN_LETRAS,
        value: convertirMontoEnLetras(mtoImpVenta),
      },
    ];

    return {
      ...totales,
      subTotal,
      mtoImpVenta,
      details: detallesCalculados,
      legends,
      origen: ProcesoNotaCreditoEnum.GENERADA_DESDE_DATOS_SIMPLES,
    };
  }

  private validateNotaDebitoCalculadaPenalidad(
    data: CreateNotaDto,
    comprobanteOriginal: ComprobanteResponseDto,
    tipoAfectacionGravadas: number[],
    tipoAfectacionExoneradas: number[],
    tipoAfectacionInafectas: number[],
  ): boolean {

    // 1. Validar que exista un solo detalle
    if (data.details.length !== 1) {
      throw new BadRequestException(
        `La ND por penalidad debe contener exactamente un (1) ítem de detalle.`,
      );
    }

    const d = data.details[0];

    // 2. Validar código de producto fijo (PEN001)
    validateCodigoProductoNotaDebito(
      NotaDebitoMotivo.PENALIDADES,
      d.codProducto,
    );
    this.validarTipoAfectacionPenalidad(
      comprobanteOriginal,
      d.tipAfeIgv,
      tipoAfectacionGravadas,
      tipoAfectacionExoneradas,
      tipoAfectacionInafectas,
    );

    // 3.1 Validar coherencia tipAfeIgv vs montos
    if (tipoAfectacionExoneradas.includes(d.tipAfeIgv)) {
      if (d.mtoBaseIgv !== 0) {
        throw new BadRequestException(
          `El item ${d.codProducto} es exonerado (afectación ${d.tipAfeIgv}), por lo tanto mtoBaseIgv debe ser 0, recibido ${d.mtoBaseIgv}.
           ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
        );
      }
      if (d.porcentajeIgv !== 0) {
        throw new BadRequestException(
          `El item ${d.codProducto} es exonerado (afectación ${d.tipAfeIgv}), por lo tanto porcentajeIgv debe ser 0, recibido ${d.porcentajeIgv}.
          ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
        );
      }
      if (d.igv !== 0 || d.totalImpuestos !== 0) {
        throw new BadRequestException(
          `El item ${d.codProducto} es exonerado (afectación ${d.tipAfeIgv}), no debe tener IGV ni impuestos, recibido igv=${d.igv}, totalImpuestos=${d.totalImpuestos}.
          ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
        );
      }
    }

    if (tipoAfectacionInafectas.includes(d.tipAfeIgv)) {
      if (d.mtoBaseIgv !== 0) {
        throw new BadRequestException(
          `El item ${d.codProducto} es inafecto (afectación ${d.tipAfeIgv}), por lo tanto mtoBaseIgv debe ser 0, recibido ${d.mtoBaseIgv}.
          ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}
          `,
        );
      }
      if (d.porcentajeIgv !== 0) {
        throw new BadRequestException(
          `El item ${d.codProducto} es inafecto (afectación ${d.tipAfeIgv}), por lo tanto porcentajeIgv debe ser 0, recibido ${d.porcentajeIgv}.
          ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}
          `,
        );
      }
      if (d.igv !== 0 || d.totalImpuestos !== 0) {
        throw new BadRequestException(
          `El item ${d.codProducto} es inafecto (afectación ${d.tipAfeIgv}), no debe tener IGV ni impuestos, recibido igv=${d.igv}, totalImpuestos=${d.totalImpuestos}.
          ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
        );
      }
    }

    // 6. Validar cálculos del detalle
    const base = d.mtoValorUnitario ?? 0;
    const igvEsperado = tipoAfectacionGravadas.includes(d.tipAfeIgv)
      ? +(base * (d.porcentajeIgv / 100)).toFixed(2)
      : 0;

    if (d.igv !== igvEsperado) {
      throw new BadRequestException(
        `El IGV del item ${d.codProducto} no es correcto. Esperado ${igvEsperado}, recibido ${d.igv}.
        ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
      );
    }

    if (d.totalImpuestos !== igvEsperado) {
      throw new BadRequestException(
        `El total de impuestos del item ${d.codProducto} no es correcto. Esperado ${igvEsperado}, recibido ${d.totalImpuestos}.
        ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
      );
    }

    const valorVentaEsperado = +(d.mtoValorUnitario * d.cantidad).toFixed(2);
    if (valorVentaEsperado !== d.mtoValorVenta) {
      throw new BadRequestException(
        `El valor de venta del item ${d.codProducto} no es correcto. Esperado ${valorVentaEsperado}, recibido ${d.mtoValorVenta}.
       ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
      );
    }

    const precioUnitarioEsperado = +(
      d.mtoValorUnitario +
      igvEsperado / (d.cantidad || 1)
    ).toFixed(2);
    if (precioUnitarioEsperado !== d.mtoPrecioUnitario) {
      throw new BadRequestException(
        `El precio unitario del item ${d.codProducto} no es correcto. Esperado ${precioUnitarioEsperado}, recibido ${d.mtoPrecioUnitario}.
      ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
      );
    }

    // 7. Validar cabecera vs detalle
    if (tipoAfectacionGravadas.includes(d.tipAfeIgv)) {
      if (data.mtoOperGravadas !== d.mtoBaseIgv) {
        throw new BadRequestException(
          `El monto gravado en cabecera (${data.mtoOperGravadas}) no coincide con el detalle (${d.mtoBaseIgv}).
          ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
        );
      }
    }
    if (tipoAfectacionExoneradas.includes(d.tipAfeIgv)) {
      if (data.mtoOperExoneradas !== d.mtoValorVenta) {
        throw new BadRequestException(
          `El monto exonerado en cabecera (${data.mtoOperExoneradas}) no coincide con el detalle (${d.mtoValorVenta}).
          ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
        );
      }
    }
    if (tipoAfectacionInafectas.includes(d.tipAfeIgv)) {
      if (data.mtoOperInafectas !== d.mtoValorVenta) {
        throw new BadRequestException(
          `El monto inafecto en cabecera (${data.mtoOperInafectas}) no coincide con el detalle (${d.mtoValorVenta}).
          ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
        );
      }
    }

    // Validar que la cabecera corresponda al tipo de afectación
    if (tipoAfectacionGravadas.includes(d.tipAfeIgv)) {
      if (data.mtoOperExoneradas !== 0 || data.mtoOperInafectas !== 0) {
        throw new BadRequestException(
          `Si la ND es gravada, no puede tener montos en Exoneradas ni Inafectas.`,
        );
      }
    }

    if (tipoAfectacionExoneradas.includes(d.tipAfeIgv)) {
      if (data.mtoOperGravadas !== 0 || data.mtoOperInafectas !== 0) {
        throw new BadRequestException(
          `Si la ND es exonerada, no puede tener montos en Gravadas ni Inafectas.`,
        );
      }
    }

    if (tipoAfectacionInafectas.includes(d.tipAfeIgv)) {
      if (data.mtoOperGravadas !== 0 || data.mtoOperExoneradas !== 0) {
        throw new BadRequestException(
          `Si la ND es inafecta, no puede tener montos en Gravadas ni Exoneradas.`,
        );
      }
    }

    if (data.mtoIGV !== d.igv) {
      throw new BadRequestException(
        `El IGV en cabecera (${data.mtoIGV}) no coincide con el detalle (${d.igv}).
        ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
      );
    }

    if (data.subTotal !== d.mtoValorVenta) {
      throw new BadRequestException(
        `El SubTotal en cabecera (${data.subTotal}) no coincide con el detalle (${d.mtoValorVenta}).
        ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
      );
    }

    if (data.mtoImpVenta !== d.mtoValorVenta + d.igv) {
      throw new BadRequestException(
        `El Total en cabecera (${data.mtoImpVenta}) no coincide con el detalle (${d.mtoValorVenta + d.igv}).
        ${buildMensajeRecalculo(TipoDocumentoLetras.NOTA_DEBITO)}`,
      );
    }

    // 8. Validar legends
    validateLegends(data.legends, d.mtoValorVenta);

    return true;
  }

  private validarTipoAfectacionPenalidad(
    comprobanteOriginal: ComprobanteResponseDto,
    tipoAfecIgv: number,
    tipoAfectacionGravadas: number[],
    tipoAfectacionExoneradas: number[],
    tipoAfectacionInafectas: number[],
  ) {
    // 4. Determinar afectación tributaria de la factura original a nivel de detalle
    const tiposAfectacionFactura = new Set(
      comprobanteOriginal.payloadJson.details.map((f) => f.tipAfeIgv),
    );

    const esFacturaGravada = [...tiposAfectacionFactura].every((t: any) =>
      tipoAfectacionGravadas.includes(t),
    );
    const esFacturaExonerada = [...tiposAfectacionFactura].every((t: any) =>
      tipoAfectacionExoneradas.includes(t),
    );
    const esFacturaInafecta = [...tiposAfectacionFactura].every((t: any) =>
      tipoAfectacionInafectas.includes(t),
    );

    if (!(esFacturaGravada || esFacturaExonerada || esFacturaInafecta)) {
      throw new BadRequestException(
        `La factura original contiene ítems con diferentes tipos de afectación tributaria. 
       No es posible emitir ND de penalidad en este caso.`,
      );
    }
    // 5. Validar que la ND herede el régimen de la factura
    if (esFacturaGravada && !tipoAfectacionGravadas.includes(tipoAfecIgv)) {
      throw new BadRequestException(
        `La factura original es gravada, pero la ND de penalidad se envió con afectación distinta (${tipoAfecIgv}). Debe ser gravada (ej. 10).`,
      );
    }
    if (esFacturaExonerada && !tipoAfectacionExoneradas.includes(tipoAfecIgv)) {
      throw new BadRequestException(
        `La factura original es exonerada, pero la ND de penalidad se envió con afectación distinta (${tipoAfecIgv}). Debe ser exonerada (20).`,
      );
    }
    if (esFacturaInafecta && !tipoAfectacionInafectas.includes(tipoAfecIgv)) {
      throw new BadRequestException(
        `La factura original es inafecta, pero la ND de penalidad se envió con afectación distinta (${tipoAfecIgv}). Debe ser inafecta (30–36).`,
      );
    }
  }
}
