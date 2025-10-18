import { Injectable, HttpException, HttpStatus, Scope } from '@nestjs/common';
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
import { extraerHashCpe, setobjectUpdateComprobante } from 'src/util/Helpers';
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
const tipoDocDni = new Set(['1', '01']);
const tipoRucs = new Set(['6', '06']);
const tasasTributos = [MAP_TRIBUTOS.IGV.id, MAP_TRIBUTOS.ICBPER.id];
const tasasVigentes = [MAP_TRIBUTOS.IGV.id];
const tiposCatalogos = [
  TipoCatalogoEnum.UNIDAD_MEDIDA,
  TipoCatalogoEnum.TIPO_AFECTACION,
];
const facturaBoletas = new Set([TipoComprobanteEnum.BOLETA, TipoComprobanteEnum.FACTURA])
@Injectable()
export class ComprobanteService {
  constructor(
    private readonly clientService: ClienteService,
    protected readonly useCreateComprobanteCase: CreateComprobanteUseCase,
    protected readonly useUpdateCaseComprobante: UpdateComprobanteUseCase,
    protected readonly sunatLogRepo: SunatLogRepositoryImpl,
    protected readonly firmaService: FirmaService,
    protected readonly catalogoRepositoryImpl: CatalogoRepositoryImpl,
    protected readonly tributoTasaRepositoryImpl: TributoTasaRepositoryImpl,
    protected readonly findTasaByCodeUseCase: FindTasaByCodeUseCase,
    protected readonly xmlInvoiceBuilder: XmlBuilderInvoiceService
  ) {}

  private readonly RENIEC_API = 'https://api.apis.net.pe/v1/dni';
  private readonly SUNAT_API = 'https://api.apis.net.pe/v1/ruc';
  private readonly TOKEN = process.env.APIS_PERU_TOKEN; // tu token de apis.net.pe

  /**
   * Método principal unificado.
   * Detecta si es DNI o RUC y llama al método correspondiente.
   */

  async consultarDocumento(
    empresaId: number,
    auth: IUserPayload,
    client: ClienteDto,
  ) {
    try {
      let cliente = await this.clientService.getByNumDocumento(client?.numDoc);
      if (!cliente) {
        //if (tipoRucs.has(client.)) return await this.buscarRuc(numero);
        const save = new CreateClienteDto({
          nombre:
            TipoComprobanteEnum.BOLETA === client?.tipoDoc
              ? client?.rznSocial
              : '',
          tipoDocumento: client?.tipoDoc,
          numeroDocumento: client?.numDoc,
          razonSocial:
            TipoComprobanteEnum.FACTURA === client?.tipoDoc
              ? client?.rznSocial
              : '',
          direccion: client?.address?.direccion,
          correo: client?.correo,
          telefono: client?.telefono,
          empresaId,
          condicionDomicilio: 'HABIDO',
          estadoComtribuyente: 'A',
          distrito: client?.address?.distrito,
          departamento: client?.address.departamento,
          provincia: client?.address?.provincia,
        });
        cliente = (await this.clientService.create(save, auth, 'AUTOMATICO'))
          ?.data as ClienteResponseDto;
      }
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
  async procesarErrorSunat(
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
      );
    }
  }
  async prepararXmlFirmado(
    data: CreateInvoiceDto,
    certificadoDigital: any,
    claveCertificado: string,
  ) {
    const passwordDecrypt = CryptoUtil.decrypt(claveCertificado);
    let xml: string = ""
    if(facturaBoletas.has(data.tipoComprobante as TipoComprobanteEnum)) {
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

  /**
   * Consulta DNI → RENIEC
   */
  private async buscarDni(numero: string) {
    try {
      const { data } = await axios.get(`${this.RENIEC_API}?numero=${numero}`, {
        headers: { Authorization: `Bearer ${this.TOKEN}` },
      });

      return {
        tipoDocumento: '01',
        numeroDocumento: numero,
        nombre: `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`,
        apellidoPaterno: data.apellidoPaterno,
        apellidoMaterno: data.apellidoMaterno,
        nombres: data.nombres,
        fuente: 'RENIEC',
      };
    } catch (error) {
      throw new HttpException(
        'No se encontró el DNI en RENIEC',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Consulta RUC → SUNAT
   */
  private async buscarRuc(numero: string) {
    try {
      const { data } = await axios.get(`${this.SUNAT_API}?numero=${numero}`, {
        headers: { Authorization: `Bearer ${this.TOKEN}` },
      });

      return {
        tipoDocumento: '06',
        numeroDocumento: numero,
        razonSocial: data.nombre,
        direccion: data.direccion,
        estado: data.estado,
        condicion: data.condicion,
        ubigeo: data.ubigeo,
        fuente: 'SUNAT',
      };
    } catch (error) {
      throw new HttpException(
        'No se encontró el RUC en SUNAT',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
