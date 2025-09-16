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
} from 'src/util/Helpers';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
import { SunatLogRepositoryImpl } from 'src/infrastructure/database/repository/sunat-log.repository.impl';
import { CreateErrorLogDto } from 'src/domain/error-log/dto/CreateErrorLogDto';
import { CreateSunatLogDto } from 'src/domain/sunat-log/interface/sunat.log.interface';
import { XmlBuilderNotaCreditoService } from 'src/infrastructure/sunat/xml/xml-builder-nota-credito.service';
import { CreateNCDto } from 'src/domain/comprobante/dto/notasComprobante/CreateNCDto';
import { FindByEmpAndTipComAndSerieUseCase } from 'src/application/Serie/FindByEmpAndTipComAndSerieUseCase';
import { GetByCorrelativoComprobantesUseCase } from '../GetByCorrelativoComprobantesUseCase';
import { DetailDto } from 'src/domain/comprobante/dto/base/DetailDto';
import { IMtoGloables } from 'src/domain/comprobante/interface/mtos-globales';
import { convertirMontoEnLetras } from 'src/util/conversion-numero-letra';
import { FindTasaByCodeUseCase } from 'src/application/Tasa/FindTasaByCodeUseCase';

export abstract class CreateNotasBaseUseCase {
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
  ) {}

  protected abstract buildXml(data: any): string;

  async execute(data: CreateNCDto): Promise<IResponseSunat> {
    const empresa = await this.validarCatalogOyObtenerCertificado(data);
    let comprobanteId = 0;
    let xmlFirmadoError = '';
    try {
      const tributoTasa = await this.findTasaByCodeUseCase.execute(
        MAP_TRIBUTOS.IGV.id,
      );
      data.porcentajeIgv = !tributoTasa ? 0.18 : (tributoTasa.tasa ?? 0) / 100;
      const mtoCalculado = await this.addJsonNcMontos(empresa.empresaId, data);
      const mtoFinales = buildMtoGlobales(mtoCalculado);
      const jsonFinal = this.aplicarDescuentoGlobal(
        data.descuentoGlobal,
        mtoFinales,
        data,
      );
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

      console.log(xmlFirmado);
      xmlFirmadoError = xmlFirmado;
      // 3. Enviar a SUNAT
      const responseSunat = await this.sunatService.sendBill(`${fileName}.zip`, zipBuffer);
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

  private async validarCatalogOyObtenerCertificado(data: CreateNCDto) {
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
    data: CreateNCDto,
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
  /**
   * Decide si enviar con sendBill o sendSummary según tipo comprobante
   */
  protected async addJsonNcMontos(empresaId: number, data: CreateNCDto) {
    switch (data.motivo.codigo) {
      case NotaCreditoMotivo.ANULACION_OPERACION:
        return null;
      case NotaCreditoMotivo.DESCUENTO_GLOBAL:
        const numCorrelativoRelacionado =
          data?.documentoRelacionado?.correlativo;
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
        break;
    }
  }
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
  /**
   * 📌 Fórmula de prorrateo del descuento global
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

  private aplicarDescuentoGlobal(
    mtoDescuentoGlobal: number,
    mtoGlobales: IMtoGloables[],
    data: CreateNCDto, // dto con client, company, motivo, etc.
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
}
