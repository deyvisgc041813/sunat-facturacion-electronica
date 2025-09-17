import { EmpresaRepositoryImpl } from 'src/infrastructure/database/repository/empresa.repository.impl';
import { ErrorLogRepositoryImpl } from 'src/infrastructure/database/repository/error-log.repository.impl';
import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { CreateComprobanteUseCase } from './CreateComprobanteUseCase';
import { ICreateComprobante } from 'src/domain/comprobante/interface/create.interface';
import { DateUtils } from 'src/util/date.util';
import { CryptoUtil } from 'src/util/CryptoUtil';
import { ZipUtil } from 'src/util/ZipUtil';
import { ErrorMapper } from 'src/infrastructure/mapper/ErrorMapper';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { CatalogoRepositoryImpl } from 'src/infrastructure/database/repository/catalogo.repository.impl';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  LegendCodeEnum,
  MAP_TRIBUTOS,
  NotaDebitoMotivo,
  ProcesoNotaCreditoEnum,
  TIPO_AFECTACION_EXONERADAS,
  TIPO_AFECTACION_GRAVADAS,
  TIPO_AFECTACION_INAFECTAS,
  TipoCatalogoEnum,
  TipoComprobanteEnum,
  TipoDocumentoIdentidadEnum,
} from 'src/util/catalogo.enum';
import { UpdateComprobanteUseCase } from './UpdateComprobanteUseCase';
import { EstadoEnumComprobante } from 'src/util/estado.enum';
import { IResponseSunat } from 'src/domain/comprobante/interface/response.sunat.interface';
import {
  calcularMora,
  extraerHashCpe,
  setobjectUpdateComprobante,
  sonMontosCero,
} from 'src/util/Helpers';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
import { SunatLogRepositoryImpl } from 'src/infrastructure/database/repository/sunat-log.repository.impl';
import { CreateErrorLogDto } from 'src/domain/error-log/dto/CreateErrorLogDto';
import { CreateSunatLogDto } from 'src/domain/sunat-log/interface/sunat.log.interface';
import { CreateNotaDto } from 'src/domain/comprobante/dto/notasComprobante/CreateNotaDto';
import { FindByEmpAndTipComAndSerieUseCase } from 'src/application/Serie/FindByEmpAndTipComAndSerieUseCase';
import { GetByCorrelativoComprobantesUseCase } from '../GetByCorrelativoComprobantesUseCase';
import { DetailDto } from 'src/domain/comprobante/dto/base/DetailDto';
import { convertirMontoEnLetras } from 'src/util/conversion-numero-letra';
import { FindTasaByCodeUseCase } from 'src/application/Tasa/FindTasaByCodeUseCase';
import { ComprobanteResponseDto } from 'src/domain/comprobante/dto/ConprobanteResponseDto';
import { XmlBuilderNotaDebitoService } from 'src/infrastructure/sunat/xml/xml-builder-nota-debito.service';

export abstract class CreateNotaDebitoBaseUseCase {
  constructor(
    protected readonly xmlNDBuilder: XmlBuilderNotaDebitoService,
    protected readonly firmaService: FirmaService,
    protected readonly sunatService: SunatService,
    protected readonly empresaRepo: EmpresaRepositoryImpl,
    protected readonly errorLogRepo: ErrorLogRepositoryImpl,
    protected readonly useCreateComprobanteCase: CreateComprobanteUseCase,
    protected readonly catalogoRepo: CatalogoRepositoryImpl,
    protected readonly useUpdateCaseComprobante: UpdateComprobanteUseCase,
    protected readonly sunatLogRepo: SunatLogRepositoryImpl,
    protected readonly findSerieUseCase: FindByEmpAndTipComAndSerieUseCase,
    protected readonly findCorrelativoUseCase: GetByCorrelativoComprobantesUseCase,
    protected readonly findTasaByCodeUseCase: FindTasaByCodeUseCase,
  ) {}

  protected abstract buildXml(data: any): string;

  async execute(data: CreateNotaDto): Promise<IResponseSunat> {
    const empresa = await this.validarCatalogOyObtenerCertificado(data);
    let comprobanteId = 0;
    let xmlFirmadoError = '';
    try {
      const tributoTasa = await this.findTasaByCodeUseCase.execute(
        MAP_TRIBUTOS.IGV.id,
      );
      data.porcentajeIgv = !tributoTasa ? 0.18 : (tributoTasa.tasa ?? 0) / 100;
      const comprobanteOriginal = await this.obtenerComprobanteAceptado(
        data,
        empresa.empresaId,
      );
      const mtoCalculados: any = await this.buildCreditNoteAmountsJson(
        data,
        comprobanteOriginal,
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
      const comprobante = await this.registrarComprobante(
        data,
        empresa.empresaId,
      );
      comprobanteId = comprobante.response?.comprobanteId ?? 0;
      data.correlativo = comprobante.response?.correlativo ?? data.correlativo;
      // 2. Construir, firmar y comprimir XML
      const { xmlFirmado, fileName, zipBuffer } = await this.prepararXmlFirmado(
        data,
        empresa.certificadoDigital,
        empresa.claveCertificado,
      );

      console.log(xmlFirmado);
      xmlFirmadoError = xmlFirmado;
      // 3. Enviar a SUNAT
      const responseSunat = await this.sunatService.sendBill(
        `${fileName}.zip`,
        zipBuffer,
      );
      responseSunat.xmlFirmado = xmlFirmado;
      // 4. Actualizar comprobante con CDR, Hash y estado
      await this.actualizarComprobante(
        comprobanteId,
        empresa.empresaId,
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
        empresa.empresaId,
        xmlFirmadoError,
      );
      throw error;
    }
  }

  private async validarCatalogOyObtenerCertificado(data: CreateNotaDto) {
    const existCatalogo = await this.catalogoRepo.obtenerDetallePorCatalogo(
      TipoCatalogoEnum.TIPO_COMPROBANTE,
      data.tipoComprobante,
    );
    if (!existCatalogo) {
      throw new BadRequestException(
        `El tipo de comprobante ${data.tipoComprobante} no se encuentra en los catálogos de SUNAT`,
      );
    }

    const empresa = await this.empresaRepo.findCertificado(
      data.company.ruc.trim(),
    );
    if (!empresa?.certificadoDigital || !empresa?.claveCertificado) {
      throw new Error(
        `No se encontró certificado para la empresa con RUC ${data.company.ruc}`,
      );
    }
    return empresa;
  }

  private async registrarComprobante(data: any, empresaId: number) {
    const objComprobante: ICreateComprobante = {
      empresaId,
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
  ) {
    const passwordDecrypt = CryptoUtil.decrypt(claveCertificado);
    const xml = this.buildXml(data);
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
    empresaId: number,
    tipoComprobante: TipoComprobanteEnum,
    xmlFirmado: string,
    responseSunat: IResponseSunat,
  ) {
    const cdr = responseSunat.cdr?.toString('base64') ?? null;
    const hash = await extraerHashCpe(xmlFirmado);
    const motivo = responseSunat?.observaciones
      ? JSON.stringify(responseSunat.observaciones)
      : null;

    const objectUpdate = setobjectUpdateComprobante(
      tipoComprobante,
      xmlFirmado,
      cdr,
      hash,
      responseSunat.estadoSunat,
      motivo ?? '',
    );
    await this.useUpdateCaseComprobante.execute(
      comprobanteId,
      empresaId,
      objectUpdate,
    );
  }

  private async procesarErrorSunat(
    error: any,
    data: CreateNotaDto,
    comprobanteId: number,
    empresaId: number,
    xmlFirmado: string,
  ) {
    const rspError = ErrorMapper.mapError(error, {
      empresaId,
      tipo: data.tipoComprobante,
      serie: data.serie,
      correlativo: data.correlativo,
    });
    let responseSunat: IResponseSunat;
    if (rspError.tipoError === OrigenErrorEnum.SUNAT) {
      const obj = rspError.create as CreateSunatLogDto;
      obj.comprobanteId = comprobanteId;
      obj.request = JSON.stringify(data);
      await this.sunatLogRepo.save(obj);
      // 4. Actualizar comprobante con CDR, Hash y estado
      responseSunat = {
        mensaje: obj.response || 'Error SUNAT',
        estadoSunat:
          (obj.estado as EstadoEnumComprobante) ||
          EstadoEnumComprobante.RECHAZADO,
        status: false,
        observaciones: [obj.response ?? ''],
        cdr: null,
        xmlFirmado,
      };
    } else {
      await this.errorLogRepo.save(rspError.create as CreateErrorLogDto);
      responseSunat = {
        mensaje: rspError.create.mensajeError || 'Error interno',
        estadoSunat: rspError.create.estado,
        codigoResponse: rspError.create.codigoError || 'ERR_SYSTEM',
        status: false,
        observaciones: [rspError.create.mensajeError ?? ''],
        cdr: null,
        xmlFirmado,
      };
    }
    // 🔹 Actualizar comprobante siempre, sin importar el origen del error
    if (comprobanteId > 0) {
      await this.actualizarComprobante(
        comprobanteId,
        empresaId,
        data.tipoComprobante as TipoComprobanteEnum,
        xmlFirmado || '',
        responseSunat,
      );
    }
  }
  protected async buildCreditNoteAmountsJson(
    data: CreateNotaDto,
    comprobante: ComprobanteResponseDto,
  ) {
    switch (data.motivo.codigo) {
      case NotaDebitoMotivo.INTERECES_MORA:
        const esEntradaSinTotalesDev = sonMontosCero(
          data.mtoOperGravadas,
          data.mtoOperExoneradas,
          data.mtoOperInafectas,
          data.mtoIGV,
          data.mtoImpVenta,
        );

        if (esEntradaSinTotalesDev) {
          // Modo simple: calular los montos
          return this.generarMontosNotaDebitoMora(
            data,
            comprobante?.payloadJson?.details,
            comprobante.fechaEmision,
          );
        } else {
          // Modo calculado: ya se envian los montos calculados
          return this.validarNotaDebitoMora(
            data,
            comprobante,
            new Date(data.fechaPago ?? new Date()),
          );
        }
      // case NotaCreditoMotivo.DESCUENTO_GLOBAL:
      //   // payload_json viene como string → parsear a objeto
      //   const mtosGlobales = this.calcularMtosGlobales(
      //     comprobante?.payloadJson?.details,
      //   );
      //   const mtoIGV = +(
      //     mtosGlobales.mtoOperGravadas * data.porcentajeIgv
      //   ).toFixed(2);
      //   const subTotal =
      //     mtosGlobales.mtoOperGravadas +
      //     mtosGlobales.mtoOperExoneradas +
      //     mtosGlobales.mtoOperInafectas;
      //   const mtoImpVenta = subTotal + mtoIGV;
      //   return {
      //     ...mtosGlobales,
      //     mtoIGV,
      //     subTotal: +subTotal.toFixed(2),
      //     mtoImpVenta: +mtoImpVenta.toFixed(2),
      //   };
      // case NotaCreditoMotivo.DESCUENTO_POR_ITEM:
      //   const esEntradaSinTotales =
      //     data.mtoImpVenta === 0 &&
      //     data.details.some((d) => !d.mtoBaseIgv || d.mtoBaseIgv === 0);
      //   if (esEntradaSinTotales) {
      //     // Modo simple: calular los montos
      //     return this.calcularComprobanteSimple(data.details);
      //   } else {
      //     // Modo calculado: ya se envian los montos calculados
      //     return this.validarComprobanteCalculado(data);
      //   }
      // case NotaCreditoMotivo.DEVOLUCION_TOTAL:
      //   if (data.details.length === 0) {
      //     // Modo simple: calular los montos
      //     return this.calcularDevolucionTotal(
      //       comprobante?.payloadJson?.details,
      //     );
      //   } else {
      //     // Modo calculado: ya se envian los montos calculados
      //     return this.validarComprobanteDevolucionTotal(
      //       data,
      //       comprobante as ComprobanteResponseDto,
      //     );
      //   }
      // case NotaCreditoMotivo.DEVOLUCION_POR_ITEM:
      //   const esEntradaSinTotalesDev = sonMontosCero(
      //     data.mtoOperGravadas,
      //     data.mtoOperExoneradas,
      //     data.mtoOperInafectas,
      //     data.mtoIGV,
      //     data.mtoImpVenta,
      //   );

      //   if (esEntradaSinTotalesDev) {
      //     // Modo simple: calular los montos
      //     return this.calcularDevolucionPorItem(
      //       data,
      //       comprobante?.payloadJson?.details,
      //     );
      //   } else {
      //     // Modo calculado: ya se envian los montos calculados
      //     return this.validarComprobanteDevolucionPorItem(
      //       data,
      //       comprobante as ComprobanteResponseDto,
      //     );
      //   }
    }
  }

  /**
   * Metodos para la nota credito descuento por item codMotivos 05
   */
  private validarComprobanteCalculado(data: CreateNotaDto) {
    const {
      mtoOperGravadas,
      mtoOperExoneradas,
      mtoOperInafectas,
      subTotal,
      mtoIGV,
      mtoImpVenta,
      details,
    } = data;
    // Validar totales
    const subtotalEsperado =
      mtoOperGravadas + mtoOperExoneradas + mtoOperInafectas;
    if (
      parseFloat(subtotalEsperado.toFixed(2)) !==
      parseFloat(subTotal.toFixed(2))
    ) {
      throw new BadRequestException(
        `El subTotal (${subTotal}) no coincide con la suma de operaciones (${subtotalEsperado})`,
      );
    }

    const totalEsperado = subTotal + mtoIGV;
    if (
      parseFloat(totalEsperado.toFixed(2)) !==
      parseFloat(mtoImpVenta.toFixed(2))
    ) {
      throw new BadRequestException(
        `El total de la venta (${mtoImpVenta}) no coincide con la suma subtotal+IGV (${totalEsperado})`,
      );
    }

    // Validar ítems
    for (const d of details) {
      if (
        TIPO_AFECTACION_GRAVADAS.includes(d.tipAfeIgv) &&
        (!d.igv || d.igv <= 0)
      ) {
        throw new BadRequestException(
          `El ítem ${d.codProducto} es gravado pero no tiene IGV válido`,
        );
      }
      if (
        (TIPO_AFECTACION_EXONERADAS.includes(d.tipAfeIgv) ||
          TIPO_AFECTACION_INAFECTAS.includes(d.tipAfeIgv)) &&
        d.igv &&
        d.igv > 0
      ) {
        throw new BadRequestException(
          `El ítem ${d.codProducto} no debería tener IGV`,
        );
      }
    }
    return {
      valido: true,
      origen: ProcesoNotaCreditoEnum.VALIDADA_DESDE_COMPROBANTE_CALCULADO,
      mensaje: 'Comprobante calculado correctamente validado',
    };
  }
  async calcularComprobanteSimple(details: DetailDto[]) {
    // MODO SIMPLE → calculamos todo
    const detallesCalculados = details?.map((d: DetailDto) => {
      const precioBase = d.mtoValorUnitario - (d.mtoDescuento || 0);

      const mtoBaseIgv = precioBase * d.cantidad;

      const igv = TIPO_AFECTACION_GRAVADAS.includes(d.tipAfeIgv)
        ? mtoBaseIgv * (d.porcentajeIgv / 100)
        : 0;

      const mtoValorVenta = mtoBaseIgv;
      const mtoPrecioUnitario = precioBase * (1 + d.porcentajeIgv / 100);

      return {
        ...d,
        mtoBaseIgv,
        igv,
        mtoValorVenta,
        mtoPrecioUnitario,
        totalImpuestos: igv,
      };
    });

    // Totales globales
    let mtoOperGravadas = 0;
    let mtoOperExoneradas = 0;
    let mtoOperInafectas = 0;
    let mtoIGV = 0;

    for (const d of detallesCalculados) {
      if (TIPO_AFECTACION_GRAVADAS.includes(d.tipAfeIgv)) {
        mtoOperGravadas += d.mtoBaseIgv;
        mtoIGV += d.igv;
      } else if (TIPO_AFECTACION_EXONERADAS.includes(d.tipAfeIgv)) {
        mtoOperExoneradas += d.mtoBaseIgv;
      } else if (TIPO_AFECTACION_INAFECTAS.includes(d.tipAfeIgv)) {
        mtoOperInafectas += d.mtoBaseIgv;
      }
    }

    const subTotal = mtoOperGravadas + mtoOperExoneradas + mtoOperInafectas;
    const mtoImpVenta = subTotal + mtoIGV;

    const legends = [
      {
        code: LegendCodeEnum.MONTO_EN_LETRAS,
        value: convertirMontoEnLetras(mtoImpVenta),
      },
    ];

    return {
      mtoOperGravadas,
      mtoOperExoneradas,
      mtoOperInafectas,
      mtoIGV,
      subTotal,
      mtoImpVenta,
      details: detallesCalculados,
      legends,
      origen: ProcesoNotaCreditoEnum.GENERADA_DESDE_DATOS_SIMPLES,
    };
  }
  async obtenerComprobanteAceptado(
    data: CreateNotaDto,
    empresaId: number,
  ): Promise<ComprobanteResponseDto> {
    const numCorrelativoRelacionado = data?.documentoRelacionado?.correlativo;
    const tipCompRelacionado = data?.documentoRelacionado?.tipoComprobante;
    const serieRelacionado = data?.documentoRelacionado?.serie;
    const serie = await this.findSerieUseCase.execute(
      empresaId,
      tipCompRelacionado,
      serieRelacionado,
    );
    if (!serie) {
      throw new BadRequestException(
        `El tipo de comprobante ${data.tipoComprobante} no se encuentra registrado en el sistema`,
      );
    }
    // 1. Buscar comprobante original
    const comprobante = await this.findCorrelativoUseCase.execute(
      empresaId,
      numCorrelativoRelacionado,
      serie?.serieId,
    );
    if (!comprobante) {
      throw new NotFoundException(`No se encontró el comprobante `);
    }
    return comprobante;
  }

  /** 
   Metodos para la nota credito devolucion total codMotivos 06:
   El array de detalle para esta nota credito se toma tal cual que esta en el comprobante original.
  */
  private calcularDevolucionTotal(details: DetailDto[]) {
    const { mtoOperGravadas, mtoOperExoneradas, mtoOperInafectas, mtoIGV } =
      details?.reduce(
        (acc, d) => {
          if (TIPO_AFECTACION_GRAVADAS.includes(d.tipAfeIgv)) {
            acc.mtoOperGravadas += d.mtoBaseIgv;
            acc.mtoIGV += d.igv;
          } else if (TIPO_AFECTACION_EXONERADAS.includes(d.tipAfeIgv)) {
            acc.mtoOperExoneradas += d.mtoValorVenta;
          } else if (TIPO_AFECTACION_INAFECTAS.includes(d.tipAfeIgv)) {
            acc.mtoOperInafectas += d.mtoValorVenta;
          }
          return acc;
        },
        {
          mtoOperGravadas: 0,
          mtoOperExoneradas: 0,
          mtoOperInafectas: 0,
          mtoIGV: 0,
        },
      );

    const subTotal = mtoOperGravadas + mtoOperExoneradas + mtoOperInafectas;
    const mtoImpVenta = subTotal + mtoIGV;
    const legends = [
      {
        code: LegendCodeEnum.MONTO_EN_LETRAS,
        value: convertirMontoEnLetras(mtoImpVenta),
      },
    ];

    return {
      mtoOperGravadas,
      mtoOperExoneradas,
      mtoOperInafectas,
      mtoIGV,
      subTotal,
      mtoImpVenta,
      details: [],
      legends,
      origen: ProcesoNotaCreditoEnum.GENERADA_DESDE_DATOS_SIMPLES,
    };
  }
  private validarComprobanteDevolucionTotal(
    data: CreateNotaDto,
    comprobante: ComprobanteResponseDto,
  ) {
    const {
      mtoOperGravadas,
      mtoOperExoneradas,
      mtoOperInafectas,
      subTotal,
      mtoIGV,
      mtoImpVenta,
      details,
    } = data;

    // --- Validación de consistencia interna ---
    const subtotalEsperado =
      (mtoOperGravadas || 0) +
      (mtoOperExoneradas || 0) +
      (mtoOperInafectas || 0);

    if (
      parseFloat(subtotalEsperado.toFixed(2)) !==
      parseFloat((subTotal || 0).toFixed(2))
    ) {
      throw new BadRequestException(
        `El subTotal (${subTotal}) no coincide con la suma de operaciones (${subtotalEsperado})`,
      );
    }

    const totalEsperado = (subTotal || 0) + (mtoIGV || 0);
    if (
      parseFloat(totalEsperado.toFixed(2)) !==
      parseFloat((mtoImpVenta || 0).toFixed(2))
    ) {
      throw new BadRequestException(
        `El total de la venta (${mtoImpVenta}) no coincide con la suma subtotal+IGV (${totalEsperado})`,
      );
    }

    // Validar ítems (coherencia con tipo de afectación)
    for (const d of details) {
      if (
        TIPO_AFECTACION_GRAVADAS.includes(d.tipAfeIgv) &&
        (!d.igv || d.igv <= 0)
      ) {
        throw new BadRequestException(
          `El ítem ${d.codProducto} es gravado pero no tiene IGV válido`,
        );
      }
      if (
        (TIPO_AFECTACION_EXONERADAS.includes(d.tipAfeIgv) ||
          TIPO_AFECTACION_INAFECTAS.includes(d.tipAfeIgv)) &&
        d.igv &&
        d.igv > 0
      ) {
        throw new BadRequestException(
          `El ítem ${d.codProducto} no debería tener IGV`,
        );
      }
    }

    // --- Validación contra comprobante original ---
    const original = comprobante?.payloadJson;
    if (!original) {
      throw new BadRequestException(
        `El comprobante original no contiene información para validar`,
      );
    }

    if (
      parseFloat(mtoOperGravadas.toFixed(2)) !==
      parseFloat(original.mtoOperGravadas.toFixed(2))
    ) {
      throw new BadRequestException(
        `El monto gravado (${mtoOperGravadas}) no coincide con el comprobante original (${original.mtoOperGravadas}).
        Si no es posible cuadrar los montos, envíe la estructura mínima del comprobante de Nota de Crédito con montos en cero y el details: [].`,
      );
    }

    if (
      parseFloat(mtoOperExoneradas.toFixed(2)) !==
      parseFloat(original.mtoOperExoneradas.toFixed(2))
    ) {
      throw new BadRequestException(
        `El monto exonerado (${mtoOperExoneradas}) no coincide con el comprobante original (${original.mtoOperExoneradas}).
        Si no es posible cuadrar los montos, envíe la estructura mínima del comprobante de Nota de Crédito con montos en cero y el details: [].`,
      );
    }

    if (
      parseFloat(mtoOperInafectas.toFixed(2)) !==
      parseFloat(original.mtoOperInafectas.toFixed(2))
    ) {
      throw new BadRequestException(
        `El monto inafecto (${mtoOperInafectas}) no coincide con el comprobante original (${original.mtoOperInafectas}).
        Si no es posible cuadrar los montos, envíe la estructura mínima del comprobante de Nota de Crédito con montos en cero y el details: [].`,
      );
    }

    if (
      parseFloat(mtoIGV.toFixed(2)) !== parseFloat(original.mtoIGV.toFixed(2))
    ) {
      throw new BadRequestException(
        `El IGV (${mtoIGV}) no coincide con el comprobante original (${original.mtoIGV}).
        Si no es posible cuadrar los montos, envíe la estructura mínima del comprobante de Nota de Crédito con montos en cero y el details: [].`,
      );
    }

    if (
      parseFloat(mtoImpVenta.toFixed(2)) !==
      parseFloat(original.mtoImpVenta.toFixed(2))
    ) {
      throw new BadRequestException(
        `El total de la venta (${mtoImpVenta}) no coincide con el comprobante original (${original.mtoImpVenta}).
        Si no es posible cuadrar los montos, envíe la estructura mínima del comprobante de Nota de Crédito con montos en cero y el details: [].`,
      );
    }

    if (details.length !== original.details.length) {
      throw new BadRequestException(
        `La cantidad de ítems (${details.length}) no coincide con el comprobante original (${original.details.length}).
        Si no es posible cuadrar los montos, envíe la estructura mínima del comprobante de Nota de Crédito con montos en cero y el details: [].`,
      );
    }
    // Aquí también podrías validar item por item (codProducto, montos, igv, etc.)
    // para garantizar que los detalles son idénticos.
    return {
      valido: true,
      origen: ProcesoNotaCreditoEnum.VALIDADA_DESDE_COMPROBANTE_CALCULADO,
      mensaje:
        'Comprobante calculado y validado correctamente contra el original',
    };
  }

  /** 
   Metodos para la nota debito  interes por mora codMotivo 01:
   se debe agregar el nuevo item que se envia desde el json de entrada y recalculados los montos con el nuevo item.
  */
  // private generarMontosNotaDebitoMora(
  //   data: CreateNotaDto,
  //   detailsComprobante: DetailDto[],
  // ) {
  //   const totales = {
  //     mtoOperGravadas: 0,
  //     mtoOperExoneradas: 0,
  //     mtoOperInafectas: 0,
  //     mtoIGV: 0,
  //   };

  //   // Partimos de los ítems originales
  //   const detallesNotaDebito: DetailDto[] = [...detailsComprobante];

  //   // Agregamos los ítems adicionales enviados por el cliente (ej: Interés por mora)
  //   for (const nuevo of data.details ?? []) {
  //     // Calcular IGV del nuevo ítem
  //     if (TIPO_AFECTACION_GRAVADAS.includes(nuevo.tipAfeIgv)) {
  //       nuevo.mtoBaseIgv = nuevo.mtoValorUnitario * nuevo.cantidad;
  //       nuevo.igv = +(nuevo.mtoBaseIgv * (nuevo.porcentajeIgv / 100)).toFixed(
  //         2,
  //       );
  //       nuevo.totalImpuestos = nuevo.igv;
  //       nuevo.mtoValorVenta = nuevo.mtoBaseIgv;
  //       nuevo.mtoPrecioUnitario = +(
  //         nuevo.mtoValorUnitario *
  //         (1 + nuevo.porcentajeIgv / 100)
  //       ).toFixed(2);
  //     }
  //     // Si fuera exonerado o inafecto, se puede calcular similar (sin IGV)
  //     else if (TIPO_AFECTACION_EXONERADAS.includes(nuevo.tipAfeIgv)) {
  //       nuevo.mtoBaseIgv = 0;
  //       nuevo.igv = 0;
  //       nuevo.totalImpuestos = 0;
  //       nuevo.mtoValorVenta = nuevo.mtoValorUnitario * nuevo.cantidad;
  //       nuevo.mtoPrecioUnitario = nuevo.mtoValorUnitario;
  //     } else if (TIPO_AFECTACION_INAFECTAS.includes(nuevo.tipAfeIgv)) {
  //       nuevo.mtoBaseIgv = 0;
  //       nuevo.igv = 0;
  //       nuevo.totalImpuestos = 0;
  //       nuevo.mtoValorVenta = nuevo.mtoValorUnitario * nuevo.cantidad;
  //       nuevo.mtoPrecioUnitario = nuevo.mtoValorUnitario;
  //     }
  //     detallesNotaDebito.push(nuevo);
  //   }

  //   // Recalcular montos globales (sumando originales + nuevos)
  //   for (const d of detallesNotaDebito) {
  //     if (TIPO_AFECTACION_GRAVADAS.includes(d.tipAfeIgv)) {
  //       totales.mtoOperGravadas += d.mtoBaseIgv ?? 0;
  //       totales.mtoIGV += d.igv ?? 0;
  //     } else if (TIPO_AFECTACION_EXONERADAS.includes(d.tipAfeIgv)) {
  //       totales.mtoOperExoneradas += d.mtoValorVenta ?? 0;
  //     } else if (TIPO_AFECTACION_INAFECTAS.includes(d.tipAfeIgv)) {
  //       totales.mtoOperInafectas += d.mtoValorVenta ?? 0;
  //     }
  //   }

  //   const subTotal =
  //     totales.mtoOperGravadas +
  //     totales.mtoOperExoneradas +
  //     totales.mtoOperInafectas;
  //   const mtoImpVenta = subTotal + totales.mtoIGV;

  //   const legends = [
  //     {
  //       code: LegendCodeEnum.MONTO_EN_LETRAS,
  //       value: convertirMontoEnLetras(mtoImpVenta),
  //     },
  //   ];

  //   return {
  //     ...totales,
  //     subTotal,
  //     mtoImpVenta,
  //     details: detallesNotaDebito, // originales + intereses
  //     legends,
  //     origen: ProcesoNotaCreditoEnum.GENERADA_DESDE_DATOS_SIMPLES,
  //   };
  // }
  private generarMontosNotaDebitoMora(
    data: CreateNotaDto,
    detailsComprobante: DetailDto[],
    fechaVencimiento: Date,
  ) {
    const totales = {
      mtoOperGravadas: 0,
      mtoOperExoneradas: 0,
      mtoOperInafectas: 0,
      mtoIGV: 0,
    };

    // Clonamos ítems originales del comprobante
    const detallesNotaDebito: DetailDto[] = [...detailsComprobante];

    /**
     * 1. Calcular el monto pendiente sobre el cual se aplica la mora
     */
    const montoPendiente = detailsComprobante.reduce(
      (sum, d) => sum + (d.mtoValorVenta ?? 0),
      0,
    );

    /**
     * 2. Calcular la mora usando tasa SUNAT o contractual
     */
    const tasaAnual = 14.64; // % anual (parametrizable)
    const fechaPago = new Date(data.fechaPago ?? new Date());

    const montoMora = calcularMora(
      montoPendiente,
      tasaAnual,
      fechaVencimiento,
      fechaPago,
    );

    /**
     * 3. Generar ítem de mora (si hay monto > 0),
     *    pero tomando la metadata del detalle ya recibido en data.details
     */
    if (montoMora > 0) {
      const baseMora = data.details?.find((d) => d.codProducto === 'INT001');
      if (baseMora) {
        const igv = +(montoMora * (baseMora.porcentajeIgv / 100)).toFixed(2);

        const itemMora: DetailDto = {
          ...baseMora, // conserva codProducto, unidad, descripcion, etc.
          cantidad: 1,
          mtoValorUnitario: montoMora,
          mtoBaseIgv: montoMora,
          igv,
          totalImpuestos: igv,
          mtoValorVenta: montoMora,
          mtoPrecioUnitario: +(
            montoMora *
            (1 + baseMora.porcentajeIgv / 100)
          ).toFixed(2),
        };

        detallesNotaDebito.push(itemMora);
      }
    }

    /**
     * 4. Agregar otros ítems adicionales enviados en data.details
     *    (ej. penalidades distintas al interés por mora)
     */
    for (const nuevo of data.details ?? []) {
      if (nuevo.codProducto === 'INT001') continue; // evitar duplicar el de mora

      if (TIPO_AFECTACION_GRAVADAS.includes(nuevo.tipAfeIgv)) {
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
        nuevo.mtoValorVenta = nuevo.mtoValorUnitario * nuevo.cantidad;
        nuevo.mtoPrecioUnitario = nuevo.mtoValorUnitario;
      }
      detallesNotaDebito.push(nuevo);
    }

    /**
     * 5. Recalcular totales globales
     */
    for (const d of detallesNotaDebito) {
      if (TIPO_AFECTACION_GRAVADAS.includes(d.tipAfeIgv)) {
        totales.mtoOperGravadas += d.mtoBaseIgv ?? 0;
        totales.mtoIGV += d.igv ?? 0;
      } else if (TIPO_AFECTACION_EXONERADAS.includes(d.tipAfeIgv)) {
        totales.mtoOperExoneradas += d.mtoValorVenta ?? 0;
      } else if (TIPO_AFECTACION_INAFECTAS.includes(d.tipAfeIgv)) {
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
  ) {
    const original = comprobante.payloadJson;

    // 1. Calcular monto pendiente (base del original)
    const montoPendiente =
      (original.mtoOperGravadas ?? 0) +
      (original.mtoOperExoneradas ?? 0) +
      (original.mtoOperInafectas ?? 0);

    // 2. Calcular mora esperada
    const tasaAnual = 14.64; // parametrizable
    const fechaVencimiento = new Date(original?.fechaEmision);
    const montoMora = calcularMora(
      montoPendiente,
      tasaAnual,
      fechaVencimiento,
      fechaPago,
    );
    const igvMora = +(montoMora * data.porcentajeIgv).toFixed(2); // 18% fijo

    // 3. Validar que los totales no sean menores al comprobante original
    if (data.mtoOperGravadas < original.mtoOperGravadas) {
      throw new BadRequestException(
        `El monto gravado (${data.mtoOperGravadas}) no puede ser menor al comprobante original (${original.mtoOperGravadas}).
        Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero.`,
      );
    }
    if (data.mtoOperExoneradas < original.mtoOperExoneradas) {
      throw new BadRequestException(
        `El monto exonerado (${data.mtoOperExoneradas}) no puede ser menor al comprobante original (${original.mtoOperExoneradas})).
        Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero.`,
      );
    }
    if (data.mtoOperInafectas < original.mtoOperInafectas) {
      throw new BadRequestException(
        `El monto inafecto (${data.mtoOperInafectas}) no puede ser menor al comprobante original (${original.mtoOperInafectas})).
        Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero.`,
      );
    }
    // 4. Validar ítems
    for (const d of data.details) {
      const existeEnOriginal = original.details.find(
        (o) => o.codProducto === d.codProducto,
      );

      if (existeEnOriginal) {
        // No se deben modificar campos clave del ítem original
        if (d.unidad !== existeEnOriginal.unidad) {
          throw new BadRequestException(
            `El ítem ${d.codProducto} no puede cambiar de unidad (${d.unidad} vs ${existeEnOriginal.unidad})).
            Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero.`,
          );
        }
        if (d.codProducto !== existeEnOriginal.codProducto) {
          throw new BadRequestException(
            `El ítem recibido tiene código ${d.codProducto}, pero en el comprobante original era ${existeEnOriginal.codProducto}.
             Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero.`,
          );
        }
      } else {
        // Solo se admite el ítem de mora
        if (d.codProducto !== 'INT001') {
          throw new BadRequestException(
            `El ítem ${d.codProducto} no existe en el comprobante original y no es un concepto válido adicional.
            Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero.`,
          );
        }

        // Validar que el ítem de mora esté bien calculado
        if (d.mtoValorUnitario !== montoMora || d.igv !== igvMora) {
          throw new BadRequestException(
            `El ítem de mora está mal calculado. Se esperaba valor ${montoMora} e IGV ${igvMora}.
            Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero.`,
          );
        }
      }
    }

    // 5. Totales esperados
    const mtoOperGravadasEsperado = +(
      original.mtoOperGravadas + montoMora
    ).toFixed(2);
    const mtoIGVEsperado = +(original.mtoIGV + igvMora).toFixed(2);
    const subTotalEsperado =
      mtoOperGravadasEsperado +
      (original.mtoOperExoneradas ?? 0) +
      (original.mtoOperInafectas ?? 0);
    const mtoImpVentaEsperado = subTotalEsperado + mtoIGVEsperado;

    // 6. Validar totales
    if (data.mtoOperGravadas !== mtoOperGravadasEsperado) {
      throw new BadRequestException(
        `El monto gravado (${data.mtoOperGravadas}) no coincide con el esperado (${mtoOperGravadasEsperado})).
        Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero.`,
      );
    }
    if (data.mtoIGV !== mtoIGVEsperado) {
      throw new BadRequestException(
        `El IGV (${data.mtoIGV}) no coincide con el esperado (${mtoIGVEsperado})).
        Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero.`,
      );
    }
    if (data.subTotal !== subTotalEsperado) {
      throw new BadRequestException(
        `El subTotal (${data.subTotal}) no coincide con el esperado (${subTotalEsperado})).
        Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero.`,
      );
    }
    if (data.mtoImpVenta !== mtoImpVentaEsperado) {
      throw new BadRequestException(
        `El total de la venta (${data.mtoImpVenta}) no coincide con el esperado (${mtoImpVentaEsperado})).
        Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero.`,
      );
    }

    return {
      valido: true,
      mensaje:
        'Nota de Débito por mora validada correctamente contra comprobante original',
    };
  }
}
