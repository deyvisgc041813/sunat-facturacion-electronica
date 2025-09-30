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
  MAP_TRIBUTOS,
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
import { ComprobantesHelper } from 'src/util/comprobante-helpers';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/sunat-log/sunat-log.repository.impl';
import { ICatalogoRepository } from 'src/domain/catalogo/interface/catalogo.repository';
import { ITributoTasaRepository } from 'src/domain/tributo-tasa/tasa-tributo.repository';
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/sucursal/sucursal.repository.impl';
import { SucursalResponseDto } from 'src/domain/sucursal/dto/SucursalResponseDto';
import { GetCertificadoDto } from 'src/domain/empresa/dto/GetCertificadoDto';
import { EmpresaInternaResponseDto } from 'src/domain/empresa/dto/EmpresaInternaResponseDto';

export abstract class CreateInvoiceBaseUseCase {
  constructor(
    protected readonly xmlInvoiceBuilder: XmlBuilderInvoiceService,
    protected readonly firmaService: FirmaService,
    protected readonly sunatService: SunatService,
    protected readonly sucurSalRepo: SucursalRepositoryImpl,
    protected readonly errorLogRepo: ErrorLogRepositoryImpl,
    protected readonly useCreateComprobanteCase: CreateComprobanteUseCase,
    protected readonly catalogoRepo: ICatalogoRepository,
    protected readonly useUpdateCaseComprobante: UpdateComprobanteUseCase,
    protected readonly sunatLogRepo: SunatLogRepositoryImpl,
    protected readonly tributoRepo: ITributoTasaRepository,
  ) {}

  protected abstract buildXml(data: CreateInvoiceDto): string;

  async execute(
    data: CreateInvoiceDto,
    empresaId: number,
    surcursalId: number,
  ): Promise<IResponseSunat> {
    const sucursal = await this.sucurSalRepo.findSucursalInterna(
      empresaId,
      surcursalId,
    );
    if (!sucursal) {
      throw new BadRequestException(
        `No se encontró ninguna sucursal asociada al identificador proporcionado (${surcursalId}). Verifique que el ID sea correcto.`,
      );
    }
    const empresa = await this.validarCatalogOyObtenerCertificado(
      data,
      sucursal
    );

    // Centralizamos las variables necesarias para manejar errores
    const contextoError = {
      comprobanteId: 0,
      sucursalId: 0,
      xmlFirmado: '',
      data,
    };

    try {
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
      const comprobante = await this.registrarComprobante(invoice, surcursalId);
      contextoError.comprobanteId = comprobante.response?.comprobanteId ?? 0;
      invoice.correlativo = comprobante.response?.correlativo ?? 0;
      // esto tambien agregar en nota de credito y debito , resumens y bajas
      ((invoice.correoEmpresa = empresa.correo),
        (invoice.telefonoEmpresa = empresa.telefono));
      invoice.signatureId = sucursal?.signatureId ?? '';
      invoice.signatureNote = sucursal?.signatureNote ?? '';
      invoice.codigoEstablecimientoSunat =
        sucursal?.codigoEstablecimientoSunat ?? '';
      // 4. Construir, firmar y comprimir XML
      const { xmlFirmado, fileName, zipBuffer } = await this.prepararXmlFirmado(
        invoice,
        empresa.certificadoDigital,
        empresa.claveCertificado,
      );
      contextoError.xmlFirmado = xmlFirmado;
      contextoError.sucursalId = surcursalId
      const usuarioSecundario = empresa?.usuarioSolSecundario ?? '';
      const claveSecundaria = CryptoUtil.decrypt(
        empresa.claveSolSecundario ?? '',
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

  private async validarCatalogOyObtenerCertificado(
    data: CreateInvoiceDto,
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

  private async registrarComprobante(
    data: CreateInvoiceDto,
    sucursalId: number,
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
      mtoIcbper: data.icbper
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
    if (rspError.tipoError === OrigenErrorEnum.SUNAT) {
      const obj = rspError.create as CreateSunatLogDto;
      obj.comprobanteId = comprobanteId;
      obj.request = JSON.stringify(data);
      obj.sucursalId = sucursalId;
      obj.serie = `${data.serie}-${data.correlativo}`;
      obj.intentos = 0;
      obj.usuarioEnvio = 'DEYVISGC'
      obj.fechaRespuesta = new Date();
      obj.fechaEnvio = new Date()
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
