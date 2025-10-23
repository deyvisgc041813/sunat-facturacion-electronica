import { HttpException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import {
  formatDateToDDMMYYYY,
  mapResponseCodeToEstado,
} from 'src/util/Helpers';
import * as cheerio from 'cheerio';
import { ErrorCatalogService } from 'src/util/conversion.error';
import https from 'https';
import { SendCommon } from './common/send-common';
import { IResponseSunat } from 'src/domain/tenant/comprobante/interface/response.sunat.interface';
import { CpeDto } from 'src/domain/tenant/comprobante/dto/cpe/consultar-lote.cpe.dto';
import { retryAsync } from '../reintentos';
export interface ResultadoCpe {
  estado: string;
  descripcion: string;
  codigoRespuesta: string;
  raw?: string;
  error?: string;
}
const URL_CONSULT =
  'https://e-consulta.sunat.gob.pe/ol-ti-itconsvalicpe/ConsValiCpe.htm';
const URL_CAPTCHA =
  'https://e-consulta.sunat.gob.pe/ol-ti-itconsvalicpe/captcha?accion=image';

const agent = new https.Agent({
  rejectUnauthorized: false, // solo para homologación
});

@Injectable()
export class SunatService {
  private readonly url: string;
  private readonly username: string;
  private readonly password: string;

  constructor() {
    this.url =
      process.env.SUNAT_ENV === 'prod'
        ? 'https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService'
        : 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService';

    this.username = process.env.SUNAT_USER || '20000000001MODDATOS';
    this.password = process.env.SUNAT_PASSWORD || 'moddatos';
  }

  /** Enviar comprobante individual (Factura/Boleta/NC/ND) */
  async sendBill(
    fileName: string,
    zipBuffer: Buffer,
    usuario: string,
    password: string,
  ): Promise<IResponseSunat> {
    usuario = process.env.SUNAT_ENV === 'prod' ? usuario : this.username;
    password = process.env.SUNAT_ENV === 'prod' ? password : this.password;
    const envelope = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://service.sunat.gob.pe">
       <soapenv:Header/>
       <soapenv:Body>
          <ser:sendBill>
             <fileName>${fileName}</fileName>
             <contentFile>${zipBuffer.toString('base64')}</contentFile>
          </ser:sendBill>
       </soapenv:Body>
    </soapenv:Envelope>`;

    try {
      const response = await axios.post(this.url, envelope, {
        headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
        auth: { username: usuario, password: password },
        validateStatus: () => true,
      });

      // Ver si SUNAT devolvió Fault
      const faultMatch = response.data.match(
        /<soap-env:Fault[\s\S]*?<\/soap-env:Fault>/,
      );
      if (faultMatch) {
        const faultCode =
          response.data.match(/<faultcode>(.*?)<\/faultcode>/)?.[1] ??
          'UNKNOWN';
        const faultString =
          response.data.match(/<faultstring>(.*?)<\/faultstring>/)?.[1] ??
          'Error desconocido';

        const codeMatch = faultCode.match(/(\d+)/);
        const code = codeMatch ? codeMatch[1] : faultCode;

        const mensajeCatalogo = ErrorCatalogService.getMensajeError(code);
        const mensajeFinal =
          mensajeCatalogo === 'Error desconocido' && faultString
            ? faultString
            : mensajeCatalogo;

        throw SendCommon.buildSunatError(code, mensajeFinal);
      }

      // Buscar CDR
      const match = response.data.match(
        /<applicationResponse>([\s\S]*?)<\/applicationResponse>/,
      );
      if (!match)
        throw SendCommon.buildSunatError('ERR_NOCDR', 'SUNAT no devolvió CDR');

      const cdrZip = Buffer.from(match[1], 'base64');
      return await SendCommon.extraerDatosCdr(cdrZip);
    } catch (err: any) {
      throw err;
    }
  }

  /** Enviar Resumen (Boletas diarias, bajas, etc.) */
  async sendSummary(
    fileName: string,
    zipBuffer: Buffer,
    usuario: string,
    password: string,
  ): Promise<string> {
    usuario = process.env.SUNAT_ENV === 'prod' ? usuario : this.username;
    password = process.env.SUNAT_ENV === 'prod' ? password : this.password;
    const envelope = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://service.sunat.gob.pe">
       <soapenv:Header/>
       <soapenv:Body>
          <ser:sendSummary>
             <fileName>${fileName}</fileName>
             <contentFile>${zipBuffer.toString('base64')}</contentFile>
          </ser:sendSummary>
       </soapenv:Body>
    </soapenv:Envelope>`;

    try {
      const response = await retryAsync(
        async () => {
         const res =  await axios.post(this.url, envelope, {
            headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
            auth: { username: usuario, password: password },
            timeout: 90000,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            validateStatus: () => true,
          });
          const errorXml = res.data;
          const faultCode = errorXml.match(
            /<faultcode>(.*?)<\/faultcode>/,
          )?.[1];
          const faultString = errorXml.match(
            /<faultstring>(.*?)<\/faultstring>/,
          )?.[1];
          if (faultCode || faultString) {
            const retryable = this.isRetryableSunatError(
              res.status,
              faultCode,
              faultString,
            );
            if (retryable) {
              throw SendCommon.buildSunatError(faultCode, faultString);
            } else {
              throw SendCommon.buildSunatError(
                faultCode ?? '99',
                faultString ?? 'Error desconocido en SUNAT',
              );
            }
          }
          return res;
        },
        3,
        3000,
      )
      return SendCommon.parseSunatResponse(response?.data);
    } catch (err: any) {
      console.error(
        'Error en sendSummary:',
        err.response ?? err.message ?? err,
      );
      throw err;
    }
  }

  async getStatus(
    ticket: string,
    usuario: string,
    password: string,
  ): Promise<IResponseSunat> {
    usuario = process.env.SUNAT_ENV === 'prod' ? usuario : this.username;
    password = process.env.SUNAT_ENV === 'prod' ? password : this.password;
    console.log('usuario ', usuario);
    console.log('password ', password);
    console.log('ticket ', ticket);

    const envelope = `<?xml version="1.0" encoding="UTF-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://service.sunat.gob.pe"
                      xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <soapenv:Header>
          <wsse:Security>
            <wsse:UsernameToken>
                <wsse:Username>${usuario}</wsse:Username>
                <wsse:Password>${password}</wsse:Password>
            </wsse:UsernameToken>
          </wsse:Security>
      </soapenv:Header>
      <soapenv:Body>
          <ser:getStatus>
            <ticket>${ticket}</ticket>
          </ser:getStatus>
      </soapenv:Body>
    </soapenv:Envelope>
    `;

    try {
      const response = await retryAsync(
        async () => {
          const res = await axios.post(this.url, envelope, {
            headers: {
              'Content-Type': 'text/xml; charset=utf-8',
              SOAPAction: 'urn:getStatus',
            },
            timeout: 90000, // 90 segundos (recomendado)
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            validateStatus: () => true,
          });
          const errorXml = res.data;
          const faultCode = errorXml.match(
            /<faultcode>(.*?)<\/faultcode>/,
          )?.[1];
          const faultString = errorXml.match(
            /<faultstring>(.*?)<\/faultstring>/,
          )?.[1];

          if (faultCode || faultString) {
            const retryable = this.isRetryableSunatError(
              res.status,
              faultCode,
              faultString,
            );

            if (retryable) {
              throw SendCommon.buildSunatError(faultCode, faultString);
            } else {
              throw SendCommon.buildSunatError(
                faultCode ?? '99',
                faultString ?? 'Error desconocido en SUNAT',
              );
            }
          }
          return res;
        },
        3,
        3000,
      );
      const xmlResponse = response.data;
      const statusCode =
        xmlResponse.match(/<statusCode>(.*?)<\/statusCode>/)?.[1] ?? '99';
      const contentMatch = xmlResponse.match(/<content>([\s\S]*?)<\/content>/);
      let cdr: Buffer | undefined;
      if (contentMatch) {
        const content = contentMatch[1].trim();
        const isBase64 = /^[A-Za-z0-9+/=]+$/.test(content);
        if (isBase64) {
          cdr = Buffer.from(content, 'base64');
        } else {
          throw SendCommon.buildSunatError(statusCode, content);
        }
      }

      return await SendCommon.extraerDatosCdr(cdr);
    } catch (err: any) {
      console.error('Error en getStatus:', err.response ?? err.message ?? err);
      throw err;
    }
  }

  /** Consultar validez de un CPE en portal de SUNAT */
  async consultarCpe(cp: CpeDto, maxReintentos = 3): Promise<ResultadoCpe> {
    const intentos = Array.from({ length: maxReintentos }, async () => {
      const captcha = await SendCommon.getCaptchaText(URL_CAPTCHA);
      const [serie, correlativoStr] = cp.serieNumero.split('-');
      const correlativo = parseInt(correlativoStr, 10);

      const formData = new URLSearchParams();
      formData.append('accion', 'CapturaCriterioValidez');
      formData.append('num_ruc', cp.ruc);
      formData.append('tipocomprobante', cp.tipo === '01' ? '03' : '06');
      formData.append('num_serie', serie);
      formData.append('num_comprob', String(correlativo));
      formData.append('fec_emision', formatDateToDDMMYYYY(cp.fechaEmisionCpe));
      formData.append('cantidad', cp.monto.toFixed(2));
      formData.append('codigo', captcha);

      const resp = (await Promise.race([
        axios.post(URL_CONSULT, formData.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 300000,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout interno')), 400000),
        ),
      ])) as { data: string };

      const $ = cheerio.load(resp?.data);
      const mensaje = $('td.bgn').first().text().trim() || 'Sin respuesta';

      const { codigo, estado } = SendCommon.mapearCodigo(mensaje);
      return { descripcion: mensaje, estado, codigoRespuesta: codigo };
    });

    return Promise.any(intentos);
  }
  async getStatusCdr(data: CpeDto) {
    // Usuario y clave SOL
    const username = '20600887735SOROVECA'; // En producción sería RUC+UsuarioSOL
    const password = 'ambitinbe'; // En producción tu clave SOL
    const [serie, correlativoStr] = data.serieNumero.split('-');
    const correlativo = parseInt(correlativoStr, 10);
    // Datos del comprobante
    const rucComprobante = '20600887735';
    const tipoComprobante = '01';
    const serieComprobante = serie;
    const numeroComprobante = correlativo;
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://service.sunat.gob.pe">
  <soapenv:Header>
    <wsse:Security soapenv:mustUnderstand="1"
       xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
       xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>${username}</wsse:Username>
        <wsse:Password>${password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <ser:getStatusCdr>
      <rucComprobante>${rucComprobante}</rucComprobante>
      <tipoComprobante>${tipoComprobante}</tipoComprobante>
      <serieComprobante>${serieComprobante}</serieComprobante>
      <numeroComprobante>${numeroComprobante}</numeroComprobante>
    </ser:getStatusCdr>
  </soapenv:Body>
</soapenv:Envelope>`;

    try {
      const { data } = await axios.post(
        'https://e-factura.sunat.gob.pe/ol-it-wsconscpegem/billConsultService', //
        envelope,
        {
          headers: {
            'Content-Type': 'text/xml;charset=UTF-8',
            SOAPAction: 'urn:getStatusCdr',
          },
          timeout: 300000,
          validateStatus: () => true,
          httpsAgent: agent,
        },
      );

      console.log('Respuesta XML >>>', data);

      //Extraer statusCode y statusMessage
      const statusCode =
        data.match(/<statusCode>(.*?)<\/statusCode>/)?.[1] || '99';
      const statusMessage =
        data.match(/<statusMessage>(.*?)<\/statusMessage>/)?.[1] ||
        'Sin mensaje';
      const content = data.match(/<content>([\s\S]*?)<\/content>/)?.[1];

      return {
        statusCode,
        statusMessage,
        cdrZip: content ? Buffer.from(content, 'base64') : undefined,
      };
    } catch (err) {
      console.error('Error en consulta CDR:', err);
      throw err;
    }
  }
  async getStatusCpe(
    cp: CpeDto,
    usuario: string,
    passwrod: string,
  ): Promise<IResponseSunat> {
    console.log(usuario);
    console.log(passwrod);
    const url =
      'https://e-factura.sunat.gob.pe/ol-it-wsconscpegem/billConsultService';
    const [serie, correlativoStr] = cp.serieNumero.split('-');
    const correlativo = parseInt(correlativoStr, 10);
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
                      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                                        xmlns:ser="http://service.sunat.gob.pe">
                        <soapenv:Header>
                          <wsse:Security soapenv:mustUnderstand="1"
                            xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
                            <wsse:UsernameToken>
                              <wsse:Username>${usuario}</wsse:Username>
                              <wsse:Password>${passwrod}</wsse:Password>
                            </wsse:UsernameToken>
                          </wsse:Security>
                        </soapenv:Header>
                        <soapenv:Body>
                          <ser:getStatus>
                            <rucComprobante>${cp.ruc}</rucComprobante>
                            <tipoComprobante>${cp.tipo}</tipoComprobante>
                            <serieComprobante>${serie}</serieComprobante>
                            <numeroComprobante>${correlativo}</numeroComprobante>
                          </ser:getStatus>
                        </soapenv:Body>
                      </soapenv:Envelope>`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'urn:getStatus',
        },
        body: soapRequest,
      });
      if (!response.ok) {
        throw SendCommon.buildSunatError(
          `${response.status}`,
          `Error HTTP ${response.status}: ${response.statusText}`,
          response.status,
        );
      }

      const xml = await response.text();
      const json = await parseStringPromise(xml, { explicitArray: false });

      const result =
        json['S:Envelope']?.['S:Body']?.['ns0:getStatusResponse']?.['status'];

      if (!result) {
        throw SendCommon.buildSunatError(
          'SUNAT_NO_RESPONSE',
          'La respuesta de SUNAT no contiene datos válidos',
        );
      }
      const responseCode = result?.status?.statusCode || result?.statusCode;
      const description =
        result?.status?.statusMessage || result?.statusMessage;
      const estadoResult = mapResponseCodeToEstado(
        responseCode,
        description,
        [],
      );
      return {
        estadoSunat: estadoResult.estado,
        codigoResponse: estadoResult.codigo,
        mensaje: estadoResult.mensaje,
        observaciones: Array.isArray(estadoResult.observaciones)
          ? estadoResult.observaciones
          : estadoResult.observaciones
            ? [estadoResult.observaciones]
            : [],
        status: true,
        cdr: null,
      };
    } catch (error: any) {
      console.log('error ', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw SendCommon.buildSunatError(
        'SUNAT_INTERNAL_ERROR',
        (error as Error).message,
      );
    }
  }
  private isRetryableSunatError(
    httpStatus?: number,
    faultCode?: string,
    faultString?: string,
  ): boolean {
    // Errores HTTP típicos del backend SUNAT
    if (httpStatus && [500, 502, 503, 504].includes(httpStatus)) return true;

    //Normaliza el faultCode
    if (!faultCode) return false;
    const normalized = faultCode.replace(/^soap-env:Server\./i, '').trim();
    const num = parseInt(normalized.padStart(4, '0'), 10);

    //Rango de errores de sistema SUNAT (de tu CodeErrors.xml)
    const systemRanges = [
      [100, 139],
      [200, 252],
      [305, 306],
    ];
    const fixed = [
      109, 130, 131, 132, 133, 134, 135, 136, 137, 138, 2317, 2322, 2347, 2380,
    ];

    if (
      systemRanges.some(([min, max]) => num >= min && num <= max) ||
      fixed.includes(num)
    )
      return true;

    //Algunos mensajes también indican error del sistema
    const transientPatterns = [
      'Failed to establish a backside connection',
      'Internal Server Error',
      'No se pudo recibir una respuesta',
      'Error en proceso batch',
    ];
    return transientPatterns.some((t) => faultString?.includes(t));
  }
}
