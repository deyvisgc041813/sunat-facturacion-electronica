import { EmpresaRepositoryImpl } from 'src/infrastructure/persistence/empresa/empresa.repository.impl';
import { ErrorLogRepositoryImpl } from 'src/infrastructure/persistence/error-log/error-log.repository.impl';
import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { CreateComprobanteUseCase } from './CreateComprobanteUseCase';
import { ICreateComprobante } from 'src/domain/comprobante/interface/create.interface';
import { DateUtils } from 'src/util/date.util';
import { CryptoUtil } from 'src/util/CryptoUtil';
import { ZipUtil } from 'src/util/ZipUtil';
import { ErrorMapper } from 'src/domain/mapper/ErrorMapper';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { BadRequestException } from '@nestjs/common';
import {
  TipoCatalogoEnum,
  TipoComprobanteEnum,
  TipoDocumentoIdentidadEnum,
} from 'src/util/catalogo.enum';
import { UpdateComprobanteUseCase } from '../update/UpdateComprobanteUseCase';
import { EstadoEnumComprobante } from 'src/util/estado.enum';
import { IResponseSunat } from 'src/domain/comprobante/interface/response.sunat.interface';
import { extraerHashCpe, setobjectUpdateComprobante } from 'src/util/Helpers';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
import { CreateSunatLogDto } from 'src/domain/sunat-log/interface/sunat.log.interface';
import { CreateInvoiceDto } from 'src/domain/comprobante/dto/invoice/CreateInvoiceDto';
import { XmlBuilderInvoiceService } from 'src/infrastructure/sunat/xml/xml-builder-invoice.service';
import { NotaDebitoHelper } from 'src/util/comprobante-helpers';
import { CatalogoRepositoryImpl } from 'src/infrastructure/persistence/catalogo/catalogo.repository.impl';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/sunat-log/sunat-log.repository.impl';

export abstract class CreateInvoiceBaseUseCase {
  constructor(
    protected readonly xmlInvoiceBuilder: XmlBuilderInvoiceService,
    protected readonly firmaService: FirmaService,
    protected readonly sunatService: SunatService,
    protected readonly empresaRepo: EmpresaRepositoryImpl,
    protected readonly errorLogRepo: ErrorLogRepositoryImpl,
    protected readonly useCreateComprobanteCase: CreateComprobanteUseCase,
    protected readonly catalogoRepo: CatalogoRepositoryImpl,
    protected readonly useUpdateCaseComprobante: UpdateComprobanteUseCase,
    protected readonly sunatLogRepo: SunatLogRepositoryImpl,
  ) {}

  protected abstract buildXml(data: CreateInvoiceDto): string;

  async execute(data: CreateInvoiceDto): Promise<IResponseSunat> {
    const empresa = await this.validarCatalogOyObtenerCertificado(data);

    // Centralizamos las variables necesarias para manejar errores
    const contextoError = {
      comprobanteId: 0,
      empresaId: empresa.empresaId,
      xmlFirmado: '',
      data,
    };

    try {
      // 1. Validar item de la factura
      NotaDebitoHelper.validarDetallesCliente(data);

      // 2. Recalcular montos
      const invoice = NotaDebitoHelper.recalcularMontos(data);
      console.log(invoice)

      // 3. Registrar comprobante en BD
      const comprobante = await this.registrarComprobante(
        invoice,
        empresa.empresaId,
      );
      contextoError.comprobanteId = comprobante.response?.comprobanteId ?? 0;
      invoice.correlativo = comprobante.response?.correlativo ?? 0;

      // 4. Construir, firmar y comprimir XML
      const { xmlFirmado, fileName, zipBuffer } = await this.prepararXmlFirmado(
        invoice,
        empresa.certificadoDigital,
        empresa.claveCertificado,
      );
      contextoError.xmlFirmado = xmlFirmado;
      const usuarioSecundario = empresa?.usuarioSolSecundario ?? ""
      const claveSecundaria = CryptoUtil.decrypt(empresa.claveSolSecundario ?? "");
      // 5. Enviar a SUNAT
      const responseSunat = await this.enviarASunat(
        xmlFirmado,
        invoice.tipoComprobante,
        fileName,
        zipBuffer,
        usuarioSecundario,
        claveSecundaria
      );
      responseSunat.xmlFirmado = xmlFirmado;

      // 6. Actualizar comprobante con CDR, Hash y estado
      await this.actualizarComprobante(
        contextoError.comprobanteId,
        empresa.empresaId,
        invoice.tipoComprobante as TipoComprobanteEnum,
        xmlFirmado,
        responseSunat,
      );

      return responseSunat;
    } catch (error: any) {
      await this.procesarErrorSunat(
        error,
        contextoError.data,
        contextoError.comprobanteId,
        contextoError.empresaId,
        contextoError.xmlFirmado,
      );
      throw error;
    }
  }

  private async validarCatalogOyObtenerCertificado(data: CreateInvoiceDto) {
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

  private async registrarComprobante(
    data: CreateInvoiceDto,
    empresaId: number,
  ) {
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
    data: CreateInvoiceDto,
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
    data: CreateInvoiceDto,
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
      obj.empresaId = empresaId;
      obj.serie = `${data.serie}-${data.correlativo}`;
      await this.sunatLogRepo.save(obj);
      responseSunat = {
        mensaje: obj.response || 'Error SUNAT',
        estadoSunat: (obj.estado as EstadoEnumComprobante) ||  EstadoEnumComprobante.RECHAZADO,
        status: false,
        observaciones: [obj.response ?? ''],
        cdr: null,
        xmlFirmado,
      };
    } else {
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

  private async enviarASunat(
    xmlFirmado: any,
    tipoComprobante: string,
    fileName: string,
    zipBuffer: Buffer,
    usuarioSolSecundario: string,
    claveSolSecundario: string
  ): Promise<IResponseSunat> {
    switch (tipoComprobante) {
      case TipoComprobanteEnum.FACTURA:
      return await this.sunatService.sendBill(`${fileName}.zip`, zipBuffer, usuarioSolSecundario, claveSolSecundario);

      case TipoComprobanteEnum.BOLETA:
        return {
          cdr: null,
          estadoSunat: EstadoEnumComprobante.PENDIENTE,
          mensaje:
            'La boleta fue registrada localmente y será enviada a SUNAT en el Resumen Diario.',
          observaciones: [],
          status: true,
          codigoResponse: '',
          xmlFirmado,
        };

      default:
        return {
          cdr: null,
          estadoSunat: EstadoEnumComprobante.ERROR,
          mensaje: `Tipo de comprobante no soportado: ${tipoComprobante}`,
          observaciones: [],
          status: false,
          codigoResponse: '',
          xmlFirmado,
        };
    }
  }
}
