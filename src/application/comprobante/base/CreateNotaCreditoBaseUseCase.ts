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
  Catalogo53DescuentoGlobal,
  LegendCodeEnum,
  MAP_TRIBUTOS,
  NotaCreditoMotivo,
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
  buildMtoGlobales,
  extraerHashCpe,
  setobjectUpdateComprobante,
  sonMontosCero,
} from 'src/util/Helpers';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
import { SunatLogRepositoryImpl } from 'src/infrastructure/database/repository/sunat-log.repository.impl';
import { CreateErrorLogDto } from 'src/domain/error-log/dto/CreateErrorLogDto';
import { CreateSunatLogDto } from 'src/domain/sunat-log/interface/sunat.log.interface';
import { XmlBuilderNotaCreditoService } from 'src/infrastructure/sunat/xml/xml-builder-nota-credito.service';
import { CreateNotaDto } from 'src/domain/comprobante/dto/notasComprobante/CreateNotaDto';
import { FindByEmpAndTipComAndSerieUseCase } from 'src/application/Serie/FindByEmpAndTipComAndSerieUseCase';
import { GetByCorrelativoComprobantesUseCase } from '../query/GetByCorrelativoComprobantesUseCase';
import { DetailDto } from 'src/domain/comprobante/dto/base/DetailDto';
import { IMtoGloables } from 'src/domain/comprobante/interface/mtos-globales';
import { convertirMontoEnLetras } from 'src/util/conversion-numero-letra';
import { FindTasaByCodeUseCase } from 'src/application/Tasa/FindTasaByCodeUseCase';
import { ComprobanteResponseDto } from 'src/domain/comprobante/dto/ConprobanteResponseDto';
import { ValidarAnulacionComprobanteUseCase } from '../validate/ValidarAnulacionComprobanteUseCase';
import { validarComprobante } from 'src/util/notas-credito-debito.validator';

export abstract class CreateNotaCreditoBaseUseCase {
  constructor(
    protected readonly xmlNCBuilder: XmlBuilderNotaCreditoService,
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
    protected readonly validarAnulacionComprobanteUseCase: ValidarAnulacionComprobanteUseCase,
  ) {}

  protected abstract buildXml(data: any): string;

  async execute(data: CreateNotaDto): Promise<IResponseSunat> {
    const empresa = await this.validarCatalogOyObtenerCertificado(data);
    let comprobanteId = 0;
    let xmlFirmadoError = '';
    try {
      validarComprobante(data);
      if (NotaCreditoMotivo.ANULACION_OPERACION == data.motivo.codigo) {
        await this.validarAnulacionComprobanteUseCase.execute(
          empresa.empresaId,
          data.tipoComprobante,
          data.motivo.codigo,
          EstadoEnumComprobante.ACEPTADO,
          data.documentoRelacionado.serie,
          data.documentoRelacionado.correlativo,
        );
      }
      const tributoTasa = await this.findTasaByCodeUseCase.execute(
        MAP_TRIBUTOS.IGV.id,
      );
      data.porcentajeIgv = !tributoTasa ? 0.18 : (tributoTasa.tasa ?? 0) / 100;
      let comprobanteOriginal = await this.obtenerComprobanteAceptado(
        data,
        empresa.empresaId,
      );
      const mtoCalculados: any = await this.buildCreditNoteAmountsJson(
        data,
        comprobanteOriginal,
      );
      let jsonFinal: any;
      if (data.motivo.codigo == NotaCreditoMotivo.DESCUENTO_GLOBAL) {
        const mtoFinales = buildMtoGlobales(mtoCalculados);
        jsonFinal = this.aplicarDescuentoGlobal(
          data.descuentoGlobal,
          mtoFinales,
          data,
        );
      } else {
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
        } else if (
          data.motivo.codigo === NotaCreditoMotivo.DEVOLUCION_POR_ITEM
        ) {
          data.details = data.details; // ya viene del cliente
        } else {
          data.details = comprobanteOriginal?.payloadJson?.details;
        }

        data.legends = mtoCalculados?.legends ?? data.legends;
        jsonFinal = data;
      }
      const comprobante = await this.registrarComprobante(
        jsonFinal,
        empresa.empresaId,
      );
      comprobanteId = comprobante.response?.comprobanteId ?? 0;
      jsonFinal.correlativo =
        comprobante.response?.correlativo ?? jsonFinal.correlativo;
      // 2. Construir, firmar y comprimir XML
      const { xmlFirmado, fileName, zipBuffer } = await this.prepararXmlFirmado(
        jsonFinal,
        empresa.certificadoDigital,
        empresa.claveCertificado,
      );

      //console.log(xmlFirmado);
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
        jsonFinal.tipoComprobante as TipoComprobanteEnum,
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
    comprobante: ComprobanteResponseDto | null,
  ) {
    switch (data.motivo.codigo) {
      case NotaCreditoMotivo.ANULACION_OPERACION:
        return this.calcularAnulacion(comprobante?.payloadJson?.details);
        break;
      case NotaCreditoMotivo.ANULACION_ERROR_RUC:
        return null;
      case NotaCreditoMotivo.DESCUENTO_GLOBAL:
        // payload_json viene como string → parsear a objeto
        const mtosGlobales = this.calcularMtosGlobales(
          comprobante?.payloadJson?.details,
        );
        const mtoIGV = +(
          mtosGlobales.mtoOperGravadas * data.porcentajeIgv
        ).toFixed(2);
        const subTotal =
          mtosGlobales.mtoOperGravadas +
          mtosGlobales.mtoOperExoneradas +
          mtosGlobales.mtoOperInafectas;
        const mtoImpVenta = subTotal + mtoIGV;
        return {
          ...mtosGlobales,
          mtoIGV,
          subTotal: +subTotal.toFixed(2),
          mtoImpVenta: +mtoImpVenta.toFixed(2),
        };
      case NotaCreditoMotivo.DESCUENTO_POR_ITEM:
        const esEntradaSinTotales =
          data.mtoImpVenta === 0 &&
          data.details.some((d) => !d.mtoBaseIgv || d.mtoBaseIgv === 0);
        if (esEntradaSinTotales) {
          // Modo simple: calular los montos
          return this.calcularComprobanteSimple(data.details);
        } else {
          // Modo calculado: ya se envian los montos calculados
          return this.validarComprobanteCalculado(data);
        }
      case NotaCreditoMotivo.DEVOLUCION_TOTAL:
        if (data.details.length === 0) {
          // Modo simple: calular los montos
          return this.calcularDevolucionTotal(
            comprobante?.payloadJson?.details,
          );
        } else {
          // Modo calculado: ya se envian los montos calculados
          return this.validarComprobanteDevolucionTotal(
            data,
            comprobante as ComprobanteResponseDto,
          );
        }
      case NotaCreditoMotivo.DEVOLUCION_POR_ITEM:
        const esEntradaSinTotalesDev = sonMontosCero(
          data.mtoOperGravadas,
          data.mtoOperExoneradas,
          data.mtoOperInafectas,
          data.mtoIGV,
          data.mtoImpVenta,
        );

        if (esEntradaSinTotalesDev) {
          // Modo simple: calular los montos
          return this.calcularDevolucionPorItem(
            data,
            comprobante?.payloadJson?.details,
          );
        } else {
          // Modo calculado: ya se envian los montos calculados
          return this.validarComprobanteDevolucionPorItem(
            data,
            comprobante as ComprobanteResponseDto,
          );
        }
    }
  }

  private calcularAnulacion(details: DetailDto[]) {
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
      details,
      legends,
      origen: ProcesoNotaCreditoEnum.GENERADA_DESDE_DATOS_SIMPLES,
    };
  }

  /**
   *
   * Fórmula de prorrateo del descuento global
   *
   * Caso 1: Cuando la factura o boleta tiene varios tipos de afectación (gravado, exonerado, inafecto):
   *   1. Calcular el total base:
   *        baseTotal = mtoOperGravadas + mtoOperExoneradas + mtoOperInafectas
   *
   *   2. Calcular el porcentaje que representa cada tipo respecto al total:
   *        porcentajeX = mtoOperX / baseTotal
   *
   *   3. Calcular el descuento asignado a cada tipo:
   *        descX = descuentoGlobal * porcentajeX
   *
   *   4. Calcular el nuevo monto por tipo:
   *        nuevoMontoX = mtoOperX - descX
   *
   * Caso 2: Cuando solo existe un tipo de monto distinto de cero (ej. solo gravadas):
   *   - El porcentaje siempre será 1 (100%), por lo tanto:
   *        nuevoMontoX = mtoOperX - descuentoGlobal
   *   - Los demás montos se mantienen en 0.
   */

  /**
   * Metodos para la nota credito descuento global codMotivos 04
   */

  private calcularMtosGlobales(details: DetailDto[]) {
    const { gravadas, exoneradas, inafectas } = details.reduce(
      (acc: any, { tipAfeIgv, mtoValorVenta }) => {
        if (TIPO_AFECTACION_GRAVADAS.includes(tipAfeIgv)) {
          acc.gravadas += mtoValorVenta;
        } else if (TIPO_AFECTACION_EXONERADAS.includes(tipAfeIgv)) {
          acc.exoneradas += mtoValorVenta;
        } else if (TIPO_AFECTACION_INAFECTAS.includes(tipAfeIgv)) {
          acc.inafectas += mtoValorVenta;
        }
        return acc;
      },
      { gravadas: 0, exoneradas: 0, inafectas: 0 },
    );

    return {
      mtoOperGravadas: +gravadas.toFixed(2),
      mtoOperExoneradas: +exoneradas.toFixed(2),
      mtoOperInafectas: +inafectas.toFixed(2),
    };
  }

  private aplicarDescuentoGlobal(
    mtoDescuentoGlobal: number,
    mtoGlobales: IMtoGloables[],
    data: CreateNotaDto, // dto con client, company, motivo, etc.
  ) {
    // Inicializar objeto de cálculo
    const obj = {
      mtoOperGravadas: 0.0,
      mtoOperExoneradas: 0.0,
      mtoOperInafectas: 0.0,
      descGravadas: 0.0,
      descExoneradas: 0.0,
      descInafectas: 0.0,
    };

    // Filtrar montos distintos de cero
    const activos = mtoGlobales.filter((mto) => mto.mtoOperacion > 0);

    // Caso 1: Solo un tipo con valor > 0
    if (activos.length === 1) {
      const tipo = activos[0].tipo;
      const montoOriginal = activos[0].mtoOperacion;
      const newMonto = montoOriginal - mtoDescuentoGlobal;

      if (tipo.some((t) => TIPO_AFECTACION_GRAVADAS.includes(t))) {
        obj.mtoOperGravadas = newMonto;
        obj.descGravadas = mtoDescuentoGlobal;
      } else if (tipo.some((t) => TIPO_AFECTACION_EXONERADAS.includes(t))) {
        obj.mtoOperExoneradas = newMonto;
        obj.descExoneradas = mtoDescuentoGlobal;
      } else if (tipo.some((t) => TIPO_AFECTACION_INAFECTAS.includes(t))) {
        obj.mtoOperInafectas = newMonto;
        obj.descInafectas = mtoDescuentoGlobal;
      }
    } else {
      // Caso 2: Varios tipos con valor > 0 → aplicar prorrateo
      const baseTotal = activos.reduce((acc, mto) => acc + mto.mtoOperacion, 0);

      for (const mto of activos) {
        const porcentaje = mto.mtoOperacion / baseTotal;
        const descuentoAsignado = +(mtoDescuentoGlobal * porcentaje).toFixed(2);
        const newMonto = +(mto.mtoOperacion - descuentoAsignado).toFixed(2);

        if (mto.tipo.some((t) => TIPO_AFECTACION_GRAVADAS.includes(t))) {
          obj.mtoOperGravadas = newMonto;
          obj.descGravadas = descuentoAsignado;
        } else if (
          mto.tipo.some((t) => TIPO_AFECTACION_EXONERADAS.includes(t))
        ) {
          obj.mtoOperExoneradas = newMonto;
          obj.descExoneradas = descuentoAsignado;
        } else if (
          mto.tipo.some((t) => TIPO_AFECTACION_INAFECTAS.includes(t))
        ) {
          obj.mtoOperInafectas = newMonto;
          obj.descInafectas = descuentoAsignado;
        }
      }
    }

    // 📌 Paso 4: Recalcular IGV, Subtotal y Total
    const mtoIGV = +(obj.mtoOperGravadas * data.porcentajeIgv).toFixed(2); // solo sobre gravadas
    const subTotal = +(
      obj.mtoOperGravadas +
      obj.mtoOperExoneradas +
      obj.mtoOperInafectas
    ).toFixed(2);
    const mtoImpVenta = +(subTotal + mtoIGV).toFixed(2);

    // 📌 Paso 5: Armar JSON final de Nota de Crédito

    // "SEISCIENTOS SETENTA Y CUATRO CON 99/100 SOLES"
    const jsonFinal = {
      ublVersion: data.ublVersion,
      tipoOperacion: data.tipoOperacion,
      tipoComprobante: data.tipoComprobante, // 07
      serie: data.serie,
      correlativo: data.correlativo,
      fechaEmision: data.fechaEmision,
      tipoMoneda: data.tipoMoneda,
      porcentajeIgv: data.porcentajeIgv,
      client: data.client,
      company: data.company,
      documentoRelacionado: data.documentoRelacionado,
      motivo: data.motivo,
      descuentosGlobales:
        data.motivo.codigo === NotaCreditoMotivo.DESCUENTO_GLOBAL
          ? [
              {
                montoBase: mtoGlobales.reduce(
                  (acc, mto) => acc + mto.mtoOperacion,
                  0,
                ),
                monto: mtoDescuentoGlobal,
                codigo: Catalogo53DescuentoGlobal.DESCUENTO_AFECTA_IGV, // Catálogo 53 - Descuento
              },
            ]
          : [],

      mtoOperGravadas: obj.mtoOperGravadas,
      mtoOperExoneradas: obj.mtoOperExoneradas,
      mtoOperInafectas: obj.mtoOperInafectas,
      mtoIGV,
      subTotal,
      mtoImpVenta,
      details: [], // en NC 04 puede ir vacío
      legends: [
        {
          code: LegendCodeEnum.MONTO_EN_LETRAS,
          value: convertirMontoEnLetras(mtoImpVenta),
        },
      ],
      // opcional: auditoría de cómo se repartió el descuento
      auditoriaDescuentos: {
        descGravadas: obj.descGravadas,
        descExoneradas: obj.descExoneradas,
        descInafectas: obj.descInafectas,
      },
    };
    if (data.motivo.codigo === NotaCreditoMotivo.DESCUENTO_GLOBAL) {
    }
    return jsonFinal;
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
      throw new NotFoundException(
       `No se encontró un comprobante asociado al documento relacionado con la serie ${serieRelacionado} y correlativo ${numCorrelativoRelacionado}.`
      );
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
   Metodos para la nota credito devolucion por item codMotivos 07:
   Los detalles para esta nota credito se toma el item que llega para hacer la devolucion.
  */
  private calcularDevolucionPorItem(
    data: CreateNotaDto,
    detailsComprobante: DetailDto[],
  ) {
    const totales = {
      mtoOperGravadas: 0,
      mtoOperExoneradas: 0,
      mtoOperInafectas: 0,
      mtoIGV: 0,
    };

    // Filtrar y calcular solo los ítems indicados por el cliente
    const detallesNotaCredito: DetailDto[] = [];

    for (const dt of data.details ?? []) {
      const itemOriginal = detailsComprobante.find(
        (dtcom) => dtcom.codProducto === dt.codProducto,
      );

      if (!itemOriginal) {
        throw new BadRequestException(
          `El producto ${dt.codProducto} no existe en el comprobante original`,
        );
      }

      // Acumular según tipo de afectación
      if (TIPO_AFECTACION_GRAVADAS.includes(itemOriginal.tipAfeIgv)) {
        totales.mtoOperGravadas += itemOriginal.mtoBaseIgv ?? 0;
        totales.mtoIGV += itemOriginal.igv ?? 0;
      } else if (TIPO_AFECTACION_EXONERADAS.includes(itemOriginal.tipAfeIgv)) {
        totales.mtoOperExoneradas += itemOriginal.mtoValorVenta ?? 0;
      } else if (TIPO_AFECTACION_INAFECTAS.includes(itemOriginal.tipAfeIgv)) {
        totales.mtoOperInafectas += itemOriginal.mtoValorVenta ?? 0;
      }

      // Agregar detalle devuelto
      detallesNotaCredito.push(itemOriginal);
    }

    // Calcular totales finales
    const subTotal =
      totales.mtoOperGravadas +
      totales.mtoOperExoneradas +
      totales.mtoOperInafectas;
    const mtoImpVenta = subTotal + totales.mtoIGV;

    // Generar leyenda (monto en letras)
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
      details: detallesNotaCredito, // solo los ítems devueltos
      legends,
      origen: ProcesoNotaCreditoEnum.GENERADA_DESDE_DATOS_SIMPLES,
    };
  }
  private validarComprobanteDevolucionPorItem(
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
        `El subTotal (${subTotal}) no coincide con la suma de operaciones (${subtotalEsperado}).
      Si no es posible cuadrar los montos, envíe la estructura mínima del comprobante de Nota de Crédito con montos en cero y el details: [].`,
      );
    }

    const totalEsperado = (subTotal || 0) + (mtoIGV || 0);
    if (
      parseFloat(totalEsperado.toFixed(2)) !==
      parseFloat((mtoImpVenta || 0).toFixed(2))
    ) {
      throw new BadRequestException(
        `El total de la venta (${mtoImpVenta}) no coincide con la suma subtotal+IGV (${totalEsperado}).
      Si no es posible cuadrar los montos, envíe la estructura mínima del comprobante de Nota de Crédito con montos en cero y el details: [].`,
      );
    }

    // Validar ítems (coherencia con tipo de afectación)
    for (const d of details) {
      if (
        TIPO_AFECTACION_GRAVADAS.includes(d.tipAfeIgv) &&
        (!d.igv || d.igv <= 0)
      ) {
        throw new BadRequestException(
          `El ítem ${d.codProducto} es gravado pero no tiene IGV válido.
        Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero y el details: [].`,
        );
      }
      if (
        (TIPO_AFECTACION_EXONERADAS.includes(d.tipAfeIgv) ||
          TIPO_AFECTACION_INAFECTAS.includes(d.tipAfeIgv)) &&
        d.igv &&
        d.igv > 0
      ) {
        throw new BadRequestException(
          `El ítem ${d.codProducto} no debería tener IGV.
        Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero y el details: [].`,
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

    // 1. Verificar que cada ítem devuelto exista en el comprobante original
    for (const d of details) {
      const itemOriginal = original.details.find(
        (o) => o.codProducto === d.codProducto,
      );
      if (!itemOriginal) {
        throw new BadRequestException(
          `El ítem ${d.codProducto} no existe en el comprobante original.
        Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero y el details: [].`,
        );
      }

      // Validar valor unitario
      if (
        parseFloat(d.mtoValorUnitario.toFixed(2)) !==
        parseFloat(itemOriginal.mtoValorUnitario.toFixed(2))
      ) {
        throw new BadRequestException(
          `El valor unitario del ítem ${d.codProducto} (${d.mtoValorUnitario}) no coincide con el comprobante original (${itemOriginal.mtoValorUnitario}).
        Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero y el details: [].`,
        );
      }

      // Validar cantidad
      if (d.cantidad > itemOriginal.cantidad) {
        throw new BadRequestException(
          `La cantidad devuelta del ítem ${d.codProducto} (${d.cantidad}) excede la cantidad en el comprobante original (${itemOriginal.cantidad}).
        Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero y el details: [].`,
        );
      }
    }

    // 2. Verificar que los totales coincidan con la suma de ítems devueltos
    const totalBases = details.reduce((acc, d) => acc + (d.mtoBaseIgv || 0), 0);
    const totalIgv = details.reduce((acc, d) => acc + (d.igv || 0), 0);
    const totalVenta = totalBases + totalIgv;

    if (
      parseFloat(mtoOperGravadas.toFixed(2)) !==
      parseFloat(totalBases.toFixed(2))
    ) {
      throw new BadRequestException(
        `El monto gravado (${mtoOperGravadas}) no coincide con la suma de los ítems devueltos (${totalBases}).
      Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero y el details: [].`,
      );
    }

    if (parseFloat(mtoIGV.toFixed(2)) !== parseFloat(totalIgv.toFixed(2))) {
      throw new BadRequestException(
        `El IGV (${mtoIGV}) no coincide con la suma de los ítems devueltos (${totalIgv}).
      Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero y el details: [].`,
      );
    }

    if (
      parseFloat(mtoImpVenta.toFixed(2)) !== parseFloat(totalVenta.toFixed(2))
    ) {
      throw new BadRequestException(
        `El total de la venta (${mtoImpVenta}) no coincide con la suma de ítems devueltos (${totalVenta}).
      Si no es posible cuadrar los montos, envíe la estructura mínima con montos en cero y el details: [].`,
      );
    }

    return {
      valido: true,
      origen: ProcesoNotaCreditoEnum.VALIDADA_DESDE_COMPROBANTE_CALCULADO,
      mensaje:
        'Comprobante de devolución por ítem calculado y validado correctamente contra el comprobante original',
    };
  }
}
