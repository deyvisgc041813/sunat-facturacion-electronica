import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { CreateComprobanteUseCase } from './CreateComprobanteUseCase';
import { DateUtils } from 'src/util/date.util';
import { CryptoUtil } from 'src/util/CryptoUtil';
import { ZipUtil } from 'src/util/ZipUtil';
import { ErrorMapper } from 'src/domain/mapper/error-exception.mapper';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { BadRequestException } from '@nestjs/common';
import {
  CodigoSunatTasasEnum,
  TipoCatalogoEnum,
  TipoComprobanteEnum,
  TipoDocumentoIdentidadEnum,
} from 'src/util/catalogo.enum';
import { UpdateComprobanteUseCase } from '../update/UpdateComprobanteUseCase';
import { EstadoEnumComprobante } from 'src/util/estado.enum';

import { extraerHashCpe, setobjectUpdateComprobante } from 'src/util/Helpers';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
import { XmlBuilderInvoiceService } from 'src/infrastructure/sunat/xml/xml-builder-invoice.service';
import { ComprobantesHelper } from 'src/util/comprobante-helpers';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/auditoria/sunat-log.repository.impl';

import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/sucursal.repository.impl';
import { MAP_TRIBUTOS } from 'src/util/constantes';
import { FindTasaByCodeUseCase } from 'src/application/parent/Tasa/FindTasaByCodeUseCase';
import { CreateInvoiceDto } from 'src/domain/tenant/comprobante/dto/invoice/create.invoice.dto';
import { IResponseSunat } from 'src/domain/tenant/comprobante/interface/response.sunat.interface';
import { SucursalResponseDto } from 'src/domain/parent/sucursal/dto/sucursal.response.dto';
import { EmpresaInternaResponseDto } from 'src/domain/parent/empresa/dto/internal.response.dto';
import { CreateSunatLogDto } from 'src/domain/tenant/sunat-log/interface/sunat.log.interface';
import { ICreateComprobante } from 'src/domain/tenant/comprobante/interface/create.interface';
import { GetCertificadoDto } from 'src/domain/parent/empresa/dto/obtner-certificado.dto';
import { ICatalogoRepositoryPort } from 'src/domain/parent/catalogo/port/catalogo.repository.port';
import { ITributoTasaRepositoryPort } from 'src/domain/parent/tributo-tasa/port/tasa-tributo.repository.port';
import { SearchDocumentService } from '../services/search-document.service';
import { SucursalService } from 'src/domain/parent/sucursal/service/sucursal.service';

export abstract class CreateInvoiceBaseUseCase {
  constructor(
    protected readonly xmlInvoiceBuilder: XmlBuilderInvoiceService,
    protected readonly firmaService: FirmaService,
    protected readonly sunatService: SunatService,
    protected readonly sucuralService: SucursalService,
    //protected readonly sucurSalRepo: SucursalRepositoryImpl,
    protected readonly useCreateComprobanteCase: CreateComprobanteUseCase,
    protected readonly catalogoRepo: ICatalogoRepositoryPort,
    protected readonly useUpdateCaseComprobante: UpdateComprobanteUseCase,
    protected readonly sunatLogRepo: SunatLogRepositoryImpl,
    protected readonly tributoRepo: ITributoTasaRepositoryPort,
    protected readonly findTasaByCodeUseCase: FindTasaByCodeUseCase,
    protected readonly searchDocument :SearchDocumentService
  ) {}
  private readonly tasasVigentes = [MAP_TRIBUTOS.IGV.id];
  protected abstract buildXml(data: CreateInvoiceDto): string;

  async execute(
    data: CreateInvoiceDto,
    empresaId: number,
    surcursalId: number,
  ): Promise<IResponseSunat> {

    ComprobantesHelper.validarDetallesGeneralesPorComprobante(data);
    const sucursal = await this.sucuralService.getDigitalCertificate(surcursalId, empresaId)
    const contextoError = {
      comprobanteId: 0,
      sucursalId: 0,
      xmlFirmado: '',
      data,
    };
    try {
      //const client = await this.searchDocument.consultarDocumento(empresaId,  data.client?.numDoc, "MANUAL")
      console.log(sucursal)
      const tiposCatalogos = [
        TipoCatalogoEnum.UNIDAD_MEDIDA,
        TipoCatalogoEnum.TIPO_AFECTACION,
      ];
      const tasasTributos = [MAP_TRIBUTOS.IGV.id, MAP_TRIBUTOS.ICBPER.id];
      const catologo =
        (await this.catalogoRepo.obtenertipoCatalogo(tiposCatalogos)) ?? [];
      const tasas =
        (await this.tributoRepo.findByCodigosSunat(tasasTributos)) ?? [];
      // 1. Validar item de la factura
      ComprobantesHelper.validarDetallesCliente(data);
      const tributosTasa =
        (await this.findTasaByCodeUseCase.execute(this.tasasVigentes)) ?? [];
      const tasaIgv = tributosTasa.get(CodigoSunatTasasEnum.IGV);
      data.porcentajeIgv = tasaIgv == null ? 0.18 : tasaIgv / 100;
      const errores = ComprobantesHelper.validarDetalleInvoice(
        data.details,
        catologo,
        tasas,
      );
      if (errores.length > 0) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Error de validación en los detalles del comprobante',
          errors: errores,
        });
      }
      // 2. Recalcular montos
      const invoice = ComprobantesHelper.recalcularMontos(data);
      // 3. Registrar comprobante en BD
      const comprobante = await this.registrarComprobante(invoice, surcursalId, 0);
      contextoError.comprobanteId = comprobante.response?.comprobanteId ?? 0;
      invoice.correlativo = comprobante.response?.correlativo ?? 0;
      // esto tambien agregar en nota de credito y debito , resumens y bajas
      ((invoice.correoEmpresa = sucursal.correo),
        (invoice.telefonoEmpresa = sucursal.telefono));
      invoice.signatureId = sucursal?.signatureId ?? '';
      invoice.signatureNote = sucursal?.signatureNote ?? '';
      invoice.codigoEstablecimiento = sucursal?.codigoEstablecimiento ?? '';
      // 4. Construir, firmar y comprimir XML
      const { xmlFirmado, fileName, zipBuffer } = await this.prepararXmlFirmado(
        invoice,
        sucursal.certificadoDigital,
        sucursal.claveCertificado,
      );
      contextoError.xmlFirmado = xmlFirmado;
      contextoError.sucursalId = surcursalId;
      const usuarioSecundario = sucursal?.usuarioSolSecundario ?? '';
      const claveSecundaria = CryptoUtil.decrypt(
        sucursal.claveSolSecundario ?? '',
      );
      // 5. Enviar a SUNAT
      const responseSunat = await this.enviarASunat(
        xmlFirmado,
        invoice.tipoComprobante,
        fileName,
        zipBuffer,
        usuarioSecundario,
        claveSecundaria,
      );
      responseSunat.xmlFirmado = xmlFirmado;
      // 6. Actualizar comprobante con CDR, Hash y estado
      await this.actualizarComprobante(
        contextoError.comprobanteId,
        surcursalId,
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
        contextoError.sucursalId,
        contextoError.xmlFirmado,
      );
      throw error;
    }
  }
  private async registrarComprobante(
    data: CreateInvoiceDto,
    sucursalId: number,
    clientId:number
  ) {
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
      mtoIcbper: data.icbper,
      clientId
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
    sucursalId: number,
    tipoComprobante: TipoComprobanteEnum,
    xmlFirmado: string,
    responseSunat: IResponseSunat,
  ) {
    //const cdr = responseSunat.cdr?.toString('base64') ?? null;
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
    data: CreateInvoiceDto,
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
    if (rspError?.tipoError === OrigenErrorEnum.SUNAT) {
      const obj = rspError.create as CreateSunatLogDto;
      obj.comprobanteId = comprobanteId;
      obj.request = JSON.stringify(data);
      obj.sucursalId = sucursalId;
      obj.serie = `${data.serie}-${data.correlativo}`;
      obj.intentos = 0;
      obj.usuarioEnvio = 'DEYVISGC';
      obj.fechaRespuesta = new Date();
      obj.fechaEnvio = new Date();
      await this.sunatLogRepo.save(obj);
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
      responseSunat = {
        mensaje: "",
        estadoSunat: EstadoEnumComprobante.ERROR,
        codigoResponse: "",
        status: false,
        observaciones: [],
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

  private async enviarASunat(
    xmlFirmado: any,
    tipoComprobante: string,
    fileName: string,
    zipBuffer: Buffer,
    usuarioSolSecundario: string,
    claveSolSecundario: string,
  ): Promise<IResponseSunat> {
    switch (tipoComprobante) {
      case TipoComprobanteEnum.FACTURA:
        return await this.sunatService.sendBill(
          `${fileName}.zip`,
          zipBuffer,
          usuarioSolSecundario,
          claveSolSecundario,
        );

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
