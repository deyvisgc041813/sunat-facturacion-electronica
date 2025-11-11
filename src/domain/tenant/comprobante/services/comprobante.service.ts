import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios from 'axios';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { ClienteResponseDto } from 'src/domain/parent/cliente/dto/client.response.dto';
import { CreateClienteDto } from 'src/domain/parent/cliente/dto/create.client.dto';
import { ClienteService } from 'src/domain/parent/cliente/service/cliente.service';
import { ClienteDto } from 'src/domain/tenant/comprobante/dto/base/client.dto';
import { CreateInvoiceDto } from 'src/domain/tenant/comprobante/dto/invoice/create.invoice.dto';
import { ICreateComprobante } from 'src/domain/tenant/comprobante/interface/create.interface';
import {
  TipoCatalogoEnum,
  TipoComprobanteEnum,
  TipoDocumentoIdentidadEnum,
} from 'src/util/catalogo.enum';
import { DateUtils } from 'src/util/date.util';
import { CreateComprobanteUseCase } from '../../../../application/tenant/comprobante/base/CreateComprobanteUseCase';
import { IResponsePs } from 'src/domain/tenant/comprobante/interface/response.ps.interface';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { IResponseSunat } from 'src/domain/tenant/comprobante/interface/response.sunat.interface';
import {
  extraerHashCpe,
  getFechaHoraActualLima,
  getFechaHoraActualLimaFormat,
  setobjectUpdateComprobante,
} from 'src/util/Helpers';
import { UpdateComprobanteUseCase } from '../../../../application/tenant/comprobante/update/UpdateComprobanteUseCase';
import { ErrorMapper } from 'src/domain/mapper/error-exception.mapper';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
import { CreateSunatLogDto } from 'src/domain/tenant/sunat-log/interface/sunat.log.interface';
import { EstadoEnumComprobante } from 'src/util/estado.enum';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/auditoria/sunat-log.repository.impl';
import { CryptoUtil } from 'src/util/CryptoUtil';
import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { ZipUtil } from 'src/util/ZipUtil';
import { XmlBuilderInvoiceService } from 'src/infrastructure/sunat/xml/xml-builder-invoice.service';
import { MAP_TRIBUTOS } from 'src/util/constantes';
import { CatalogoRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/catalogo.repository.impl';
import { TributoTasaRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/tasa-tributo.repository.impl';
import { FindTasaByCodeUseCase } from 'src/application/parent/Tasa/FindTasaByCodeUseCase';
import { ComprobantesHelper } from 'src/util/comprobante-helpers';
import { ComprobanteRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/comprobante/comprobante.repository.impl';
import { SucursalService } from 'src/domain/parent/sucursal/service/sucursal.service';
import { CompanyDto } from '../dto/base/company.dto';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
const tasasTributos = [MAP_TRIBUTOS.IGV.id, MAP_TRIBUTOS.ICBPER.id];
const tasasVigentes = [MAP_TRIBUTOS.IGV.id];
const tiposCatalogos = [
  TipoCatalogoEnum.UNIDAD_MEDIDA,
  TipoCatalogoEnum.TIPO_AFECTACION,
];
const facturaBoletas = new Set([
  TipoComprobanteEnum.BOLETA,
  TipoComprobanteEnum.FACTURA,
]);
@Injectable()
export class ComprobanteService {
  private readonly logger = new Logger(ComprobanteService.name);
  constructor(
    private readonly clientService: ClienteService,
    protected readonly useCreateComprobanteCase: CreateComprobanteUseCase,
    protected readonly useUpdateCaseComprobante: UpdateComprobanteUseCase,
    protected readonly sunatLogRepo: SunatLogRepositoryImpl,
    protected readonly firmaService: FirmaService,
    protected readonly catalogoRepositoryImpl: CatalogoRepositoryImpl,
    protected readonly tributoTasaRepositoryImpl: TributoTasaRepositoryImpl,
    protected readonly findTasaByCodeUseCase: FindTasaByCodeUseCase,
    protected readonly xmlInvoiceBuilder: XmlBuilderInvoiceService,
    protected readonly comprobanteRepo: ComprobanteRepositoryImpl,
    protected readonly sucursalService: SucursalService,
    protected readonly sunatService: SunatService,
  ) {}

  async consultarDocumento(
    empresaId: number,
    auth: IUserPayload,
    dtoClient: ClienteDto,
  ) {
    try {
      ComprobantesHelper.validarRucEmision(dtoClient);
      let cliente = await this.clientService.getByNumDocumento(
        dtoClient?.numDoc,
      );
      if (!cliente) {
        const isFactura = TipoDocumentoIdentidadEnum.RUC === dtoClient?.tipoDoc;
        const save = new CreateClienteDto({
          nombre: isFactura ? '' : dtoClient?.rznSocial,
          tipoDocumento: dtoClient?.tipoDoc,
          numeroDocumento: dtoClient?.numDoc,
          razonSocial: isFactura ? dtoClient?.rznSocial : '',
          direccion: dtoClient?.address?.direccion,
          correo: dtoClient?.correo,
          telefono: dtoClient?.telefono,
          empresaId,
          condicionDomicilio: isFactura ? dtoClient.rucCondicion : '',
          estadoComtribuyente: isFactura ? dtoClient.rucEstado : '',
          distrito: dtoClient?.address?.distrito,
          departamento: dtoClient?.address.departamento,
          provincia: dtoClient?.address?.provincia,
        });
        cliente = (await this.clientService.create(save, auth, 'AUTOMATICO'))
          ?.data as ClienteResponseDto;
      }
      if (dtoClient.tipoDoc === TipoComprobanteEnum.FACTURA)
        cliente = await this.sincronizarClienteFactura(
          cliente,
          dtoClient,
          auth,
        );
      return cliente;
    } catch (error) {
      console.error('Error en consultarDocumento:', error.message);
      throw new HttpException(
        'No se pudo consultar el documento',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
  async registrarComprobante(
    data: CreateInvoiceDto,
    sucursalId: number,
    clientId: number,
  ): Promise<GenericResponse<IResponsePs>> {
    const objComprobante: ICreateComprobante = {
      sucursalId,
      tipoComprobante: data.tipoComprobante as TipoComprobanteEnum,
      serie: data.serie,
      numeroDocumento: data.client.numDoc,
      tipoDocumento: data.client.tipoDoc as TipoDocumentoIdentidadEnum,
      fechaEmision: DateUtils.toMySQLDateTime(data?.fechaEmision),
      fechaVencimiento: DateUtils.toMySQLDateTime(data?.fechaVencimiento),
      moneda: data.tipoMoneda,
      totalGravado: data.mtoOperGravadas ?? 0,
      totalExonerado: data.mtoOperExoneradas ?? 0,
      totalInafecto: data.mtoOperInafectas ?? 0,
      totalIgv: data.mtoIGV ?? 0,
      mtoImpVenta: data.mtoImpVenta ?? 0,
      payloadJson: JSON.stringify(data),
      mtoIcbper: data.icbper,
      clientId,
    };
    return this.useCreateComprobanteCase.execute(objComprobante, data);
  }

  async actualizarComprobante(
    comprobanteId: number,
    sucursalId: number,
    tipoComprobante: TipoComprobanteEnum,
    xmlFirmado: string,
    responseSunat: IResponseSunat,
    tenantDatabase?: string,
    compRespIdSunat?: number,
  ) {
    //const cdr = responseSunat.cdr?.toString('base64') ?? null;
    const hash = (await extraerHashCpe(xmlFirmado)) ?? '';
    const motivo = responseSunat?.observaciones
      ? JSON.stringify(responseSunat.observaciones)
      : null;
    const objectUpdate = setobjectUpdateComprobante(
      tipoComprobante,
      xmlFirmado,
      responseSunat?.cdr,
      hash,
      responseSunat?.estadoSunat,
      motivo ?? '',
    );
    if (compRespIdSunat && compRespIdSunat > 0)
      objectUpdate.compRespIdSunat = compRespIdSunat;
    await this.useUpdateCaseComprobante.execute(
      comprobanteId,
      sucursalId,
      objectUpdate,
      tenantDatabase,
    );
  }
  async procesarErrorSunat(
    error: any,
    data: CreateInvoiceDto,
    comprobanteId: number,
    sucursalId: number,
    xmlFirmado: string,
    usuario: string,
    dataBaseTenant?: string,
    comprobanteRspId?: number,
  ) {
    const rspError = ErrorMapper.mapError(error, {
      sucursalId,
      tipo: data?.tipoComprobante,
      serie: data?.serie,
      correlativo: data?.correlativo,
    });
    let responseSunat: IResponseSunat;
    if (rspError?.tipoError === OrigenErrorEnum.SUNAT) {
      const obj = rspError.create as CreateSunatLogDto;
      obj.comprobanteId = comprobanteId;
      obj.request = JSON.stringify(data);
      obj.sucursalId = sucursalId;
      obj.serie = `${data?.serie}-${data?.correlativo}`;
      obj.intentos = 0;
      obj.usuarioEnvio = usuario;
      obj.fechaRespuesta = new Date();
      obj.fechaEnvio = new Date();
      await this.sunatLogRepo.save(obj, dataBaseTenant);
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
        mensaje: '',
        estadoSunat: EstadoEnumComprobante.ERROR,
        codigoResponse: '',
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
        dataBaseTenant,
        comprobanteRspId,
      );
    }
  }
  async prepararXmlFirmado(
    data: CreateInvoiceDto,
    certificadoDigital: any,
    claveCertificado: string,
  ) {
    const passwordDecrypt = CryptoUtil.decrypt(claveCertificado);
    let xml: string = '';
    if (facturaBoletas.has(data.tipoComprobante as TipoComprobanteEnum)) {
      xml = this.xmlInvoiceBuilder.buildXml(data);
    }
    const xmlFirmado = await this.firmaService.firmarXml(
      xml,
      certificadoDigital,
      passwordDecrypt,
    );
    const fileName = `${data.company.ruc}-${data.tipoComprobante}-${data.serie}-${data.correlativo}`;
    const zipBuffer = await ZipUtil.createZip(fileName, xmlFirmado);
    return { xmlFirmado, fileName, zipBuffer };
  }
  async cargarCatalogosTributarios(): Promise<{
    catologo: any;
    tasas: any;
    tributosTasa: any;
  }> {
    const [catologo, tasas, tributosTasa] = await Promise.all([
      this.catalogoRepositoryImpl.obtenertipoCatalogo(tiposCatalogos),
      this.tributoTasaRepositoryImpl.findByCodigosSunat(tasasTributos),
      this.findTasaByCodeUseCase.execute(tasasVigentes),
    ]);

    return {
      catologo: catologo ?? [],
      tasas: tasas ?? [],
      tributosTasa: tributosTasa ?? [],
    };
  }
  async taskCronSendFcturasSunat(
    auth: IUserPayload,
    company: CompanyDto,
  ): Promise<void> {
    const tenantDatabase = auth?.subDominio;
    const empresaId = auth?.empresaId ?? 0;
    const sucursalId = auth.sucursalActiva ?? 0;
    this.logger.log(
      `[CronJob] Iniciando envío de facturas para empresa ${empresaId}`,
    );
    const sucursal = await this.sucursalService.getDigitalCertificate(
      sucursalId,
      empresaId,
    );
    const usuarioSolSecundario = sucursal?.usuarioSolSecundario ?? '';
    const claveSolSecundario = CryptoUtil.decrypt(
      sucursal.claveSolSecundario ?? '',
    );
    const fechaEmision = '2025-10-21T12:26:13-05:00'; //getFechaHoraActualLimaFormat('YYYY-MM-DDTHH:mm:ssZ'); //;
    const facturasPendientes =
      await this.comprobanteRepo.findDocumentPendientes(
        sucursalId,
        fechaEmision,
        [EstadoEnumComprobante.PENDIENTE],
        'F',
        TipoComprobanteEnum.FACTURA,
        tenantDatabase,
      );
    if (!facturasPendientes || facturasPendientes.length == 0) {
      this.logger.warn(
        `No se encontraron facturas pendientes de envio para la fecha de emisión ${fechaEmision} en la sucursal ${sucursalId}.`,
      );
    }
    for (const factura of facturasPendientes) {
      const numSerie = factura.serie?.serie;
      const numCorrelativo = factura.numeroComprobante;
      const tipoComprobante = factura?.serie?.tipoComprobante;
      const xmlFirmado = factura.comprobanteRespuestaSunat?.xmlFirmado ?? '';
      const comprobanteRsptId =
        factura.comprobanteRespuestaSunat?.comprobanteRsptId ?? 0;
      try {
        const fileName = `${company.ruc}-${tipoComprobante}-${numSerie}-${numCorrelativo}`;
        const zipBuffer = await ZipUtil.createZip(fileName, xmlFirmado);
        this.logger.log(
          `Enviando factura a SUNAT: ${numSerie}-${numCorrelativo}`,
        );
        const responseSunat = await this.sunatService.sendBill(
          `${fileName}.zip`,
          zipBuffer,
          usuarioSolSecundario,
          claveSolSecundario,
        );
        this.logger.log(
          `responseSunat: ${JSON.stringify(responseSunat, null, 2)}`,
        );

        await this.actualizarComprobante(
          factura.comprobanteId,
          sucursalId,
          tipoComprobante as TipoComprobanteEnum,
          xmlFirmado,
          responseSunat,
          tenantDatabase,
          comprobanteRsptId,
        );

        this.logger.log(
          `Factura ${numSerie}-${numCorrelativo} enviada correctamente.`,
        );
      } catch (error) {
        this.logger.error(
          `Error al procesar factura ${numSerie}-${numCorrelativo}: ${error.message}`,
        );
        const data = new CreateInvoiceDto();
        data.tipoComprobante = tipoComprobante ?? '';
        data.serie = numSerie ?? '';
        data.correlativo = numCorrelativo;
        await this.procesarErrorSunat(
          error,
          data,
          factura.comprobanteId,
          sucursalId,
          xmlFirmado,
          'Automatico',
          auth.subDominio,
          comprobanteRsptId,
        );
      }
    }
  }
  /**
   * Sincroniza los datos del cliente con los valores recibidos desde SUNAT o el comprobante,
   * actualizando la dirección, condición y estado del RUC solo si detecta cambios.
   *
   * @param cliente Cliente actual registrado en la base de datos.
   * @param dtoClient Datos del cliente recibidos desde el comprobante.
   * @param auth Usuario autenticado que ejecuta la acción.
   * @returns Cliente actualizado o el mismo si no hubo cambios.
   */
  private async sincronizarClienteFactura(
    cliente: ClienteResponseDto,
    dtoClient: ClienteDto,
    auth: IUserPayload,
  ): Promise<ClienteResponseDto> {
    const direccionNueva = dtoClient?.address?.direccion?.trim();
    const condicionNueva = dtoClient?.rucCondicion?.trim();
    const estadoNuevo = dtoClient?.rucEstado?.trim();
    const requiereActualizacion =
      cliente?.direccion?.trim() !== direccionNueva ||
      cliente?.condicionDomicilio !== condicionNueva ||
      cliente?.estadoComtribuyente !== estadoNuevo;

    if (!requiereActualizacion) return cliente;
    const clienteUpdate: Partial<ClienteResponseDto> = {
      ...cliente,
      direccion: direccionNueva,
      condicionDomicilio: condicionNueva,
      estadoComtribuyente: estadoNuevo,
    };

    await this.clientService.update(cliente.clienteId, auth, clienteUpdate);
    this.logger?.warn?.(
      `Cliente ${cliente.numeroDocumento} actualizado automáticamente por diferencias en datos SUNAT.`,
    );
    return clienteUpdate as ClienteResponseDto;
  }

  /**
   * Consulta RUC → SUNAT
   */
  private async buscarRuc(numero: string) {
    // try {
    //   const { data } = await axios.get(`${this.SUNAT_API}?numero=${numero}`, {
    //     headers: { Authorization: `Bearer ${this.TOKEN}` },
    //   });
    //   return {
    //     tipoDocumento: '06',
    //     numeroDocumento: numero,
    //     razonSocial: data.nombre,
    //     direccion: data.direccion,
    //     estado: data.estado,
    //     condicion: data.condicion,
    //     ubigeo: data.ubigeo,
    //     fuente: 'SUNAT',
    //   };
    // } catch (error) {
    //   throw new HttpException(
    //     'No se encontró el RUC en SUNAT',
    //     HttpStatus.NOT_FOUND,
    //   );
    // }
  }
  /**
   * Consulta DNI → RENIEC
   */
  private async buscarDni(numero: string) {
    // try {
    //   const { data } = await axios.get(`${this.RENIEC_API}?numero=${numero}`, {
    //     headers: { Authorization: `Bearer ${this.TOKEN}` },
    //   });
    //   return {
    //     tipoDocumento: '01',
    //     numeroDocumento: numero,
    //     nombre: `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`,
    //     apellidoPaterno: data.apellidoPaterno,
    //     apellidoMaterno: data.apellidoMaterno,
    //     nombres: data.nombres,
    //     fuente: 'RENIEC',
    //   };
    // } catch (error) {
    //   throw new HttpException(
    //     'No se encontró el DNI en RENIEC',
    //     HttpStatus.NOT_FOUND,
    //   );
    // }
  }
}
