// import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
// import axios from 'axios';
// import AdmZip from 'adm-zip';
// import { parseStringPromise } from 'xml2js';
// import { IResponseSunat } from 'src/domain/comprobante/interface/response.sunat.interface';
// import {
//   formatDateToDDMMYYYY,
//   mapResponseCodeToEstado,
// } from 'src/util/Helpers';
// import { CpeDto } from 'src/domain/comprobante/dto/cpe/ConsultarLoteCpeDto';
// import path from 'path';
// import { createWorker } from 'tesseract.js';
// import * as fs from 'fs';
// import * as cheerio from 'cheerio';
// import { ErrorCatalogService } from 'src/util/conversion.error';
// import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
// export interface ResultadoCpe {
//   estado: string;
//   descripcion: string;
//   codigoRespuesta: string;
//   raw?: string;
//   error?: string;
// }
// const URL_CONSULT =
//   'https://e-consulta.sunat.gob.pe/ol-ti-itconsvalicpe/ConsValiCpe.htm';
// const URL_CAPTCHA =
//   'https://e-consulta.sunat.gob.pe/ol-ti-itconsvalicpe/captcha?accion=image';
// @Injectable()
// export class SunatService {
//   private readonly url: string;
//   private readonly username: string;
//   private readonly password: string;
//   constructor() {
//     // Cambia según el ambiente
//     this.url =
//       process.env.SUNAT_ENV === 'prod'
//         ? 'https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService'
//         : 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService';

//     this.username = process.env.SUNAT_USER || '20000000001MODDATOS'; // pruebas
//     this.password = process.env.SUNAT_PASSWORD || 'moddatos'; // pruebas
//   }

//   /** Enviar comprobante individual (Factura/Boleta/NC/ND) */
//   // async sendBill(fileName: string, zipBuffer: Buffer): Promise<IResponseSunat> {
//   //   const envelope = `
//   //   <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
//   //                     xmlns:ser="http://service.sunat.gob.pe">
//   //      <soapenv:Header/>
//   //      <soapenv:Body>
//   //         <ser:sendBill>
//   //            <fileName>${fileName}</fileName>
//   //            <contentFile>${zipBuffer.toString('base64')}</contentFile>
//   //         </ser:sendBill>
//   //      </soapenv:Body>
//   //   </soapenv:Envelope>`;

//   //   try {
//   //     const response = await axios.post(this.url, envelope, {
//   //       headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
//   //       auth: {
//   //         username: this.username,
//   //         password: this.password,
//   //       },
//   //       validateStatus: () => true, // evita que Axios lance error en 500
//   //     });

//   //     // Buscar si hay Fault en el response
//   //     const faultMatch = response.data.match(
//   //       /<soap-env:Fault[\s\S]*?<\/soap-env:Fault>/,
//   //     );
//   //     if (faultMatch) {
//   //       const faultCodeMatch = response.data.match(
//   //         /<faultcode>(.*?)<\/faultcode>/,
//   //       );
//   //       const faultStringMatch = response.data.match(
//   //         /<faultstring>(.*?)<\/faultstring>/,
//   //       );

//   //       const error = {
//   //         code: faultCodeMatch ? faultCodeMatch[1] : 'UNKNOWN',
//   //         message: faultStringMatch ? faultStringMatch[1] : 'Error desconocido',
//   //       };

//   //       // Aquí lo guardas en DB o lo retornas
//   //       throw new Error(JSON.stringify(error));
//   //     }
//   //     // Si no hay Fault, buscar applicationResponse
//   //     const match = response.data.match(
//   //       /<applicationResponse>([\s\S]*?)<\/applicationResponse>/,
//   //     );
//   //     if (!match) {
//   //       throw new Error('SUNAT no devolvió CDR');
//   //     }
//   //     const cdrZip = Buffer.from(match[1], 'base64');
//   //     const rpta = await this.extraerDatosCdr(cdrZip);
//   //     return rpta;
//   //   } catch (err) {
//   //     console.error('Error SUNAT:', err.message || err);
//   //     throw err;
//   //   }
//   // }
//   /** Enviar comprobante individual (Factura/Boleta/NC/ND) */
//   async sendBill(fileName: string, zipBuffer: Buffer): Promise<IResponseSunat> {
//     const envelope = `
//     <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
//                       xmlns:ser="http://service.sunat.gob.pe">
//        <soapenv:Header/>
//        <soapenv:Body>
//           <ser:sendBill>
//              <fileName>${fileName}</fileName>
//              <contentFile>${zipBuffer.toString('base64')}</contentFile>
//           </ser:sendBill>
//        </soapenv:Body>
//     </soapenv:Envelope>`;

//     try {
//       const response = await axios.post(this.url, envelope, {
//         headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
//         auth: {
//           username: this.username,
//           password: this.password,
//         },
//         validateStatus: () => true, // evita que Axios lance error en 500
//       });

//       // 🔎 Buscar si hay Fault en el response
//       const faultMatch = response.data.match(
//         /<soap-env:Fault[\s\S]*?<\/soap-env:Fault>/,
//       );
//       if (faultMatch) {
//         const faultCodeMatch = response.data.match(
//           /<faultcode>(.*?)<\/faultcode>/,
//         );
//         const faultStringMatch = response.data.match(
//           /<faultstring>(.*?)<\/faultstring>/,
//         );

//         const codeRaw = faultCodeMatch ? faultCodeMatch[1] : 'UNKNOWN';
//         // extraer número (ej. soap-env:Client.2936 → 2936)
//         const codeMatch = codeRaw.match(/(\d+)/);
//         const code = codeMatch ? codeMatch[1] : codeRaw;

//         // const mensajeCatalogo = ErrorCatalogService.getMensajeError(code);

//         const mensajeCatalogo = ErrorCatalogService.getMensajeError(code);

//         // fallback: si no existe en catálogo, usa el texto real de SUNAT
//         const mensajeFinal =
//           mensajeCatalogo === 'Error desconocido' && faultStringMatch
//             ? faultStringMatch[1] // solo el contenido, no las etiquetas
//             : mensajeCatalogo;

//         // limpiar el faultstring (quita etiquetas <faultstring>)
//         // const detalleLimpio = faultStringMatch
//         //   ? faultStringMatch[1].replace(/<\/?faultstring>/g, '')
//         //   : 'Error desconocido';

//         const error = {
//           origen: OrigenErrorEnum.SUNAT,
//           code,
//           message: mensajeFinal,
//           //detalle: detalleLimpio,
//         };
//         throw new HttpException(error, HttpStatus.BAD_REQUEST);
//       }

//       // Si no hay Fault, buscar applicationResponse
//       const match = response.data.match(
//         /<applicationResponse>([\s\S]*?)<\/applicationResponse>/,
//       );
//       if (!match) {
//         throw new Error('SUNAT no devolvió CDR');
//       }
//       // Extraer el CDR
//       const cdrZip = Buffer.from(match[1], 'base64');
//       const rpta = await this.extraerDatosCdr(cdrZip);
//       return rpta;
//     } catch (err: any) {
//       console.error('Error SUNAT:', err.message || err);
//       throw err;
//     }
//   }

//   /** Enviar Resumen (Boletas diarias, bajas, etc.) → devuelve ticket */
//   async sendSummary(fileName: string, zipBuffer: Buffer): Promise<string> {
//     const envelope = `
//     <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
//                       xmlns:ser="http://service.sunat.gob.pe">
//        <soapenv:Header/>
//        <soapenv:Body>
//           <ser:sendSummary>
//              <fileName>${fileName}</fileName>
//              <contentFile>${zipBuffer.toString('base64')}</contentFile>
//           </ser:sendSummary>
//        </soapenv:Body>
//     </soapenv:Envelope>`;

//     try {
//       const response = await axios.post(this.url, envelope, {
//         headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
//         auth: { username: this.username, password: this.password },
//       });
//       return this.parseSunatResponse(response.data);
//     } catch (err) {
//       if (err.response && err.response.data) {
//         // Caso SUNAT devolvió SOAP Fault con 500
//         return this.parseSunatResponse(err.response.data);
//       }
//       console.error('Error inesperado:', err.message || err);
//       throw err;
//     }
//   }
//   /** Consultar estado de Resumen (con ticket) → devuelve CDR */
//   async getStatus(ticket: string): Promise<IResponseSunat> {
//     try {
//       const envelope = `<?xml version="1.0" encoding="UTF-8"?>
// <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
//                   xmlns:ser="http://service.sunat.gob.pe"
//                   xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
//    <soapenv:Header>
//       <wsse:Security>
//          <wsse:UsernameToken>
//             <wsse:Username>${this.username}</wsse:Username>
//             <wsse:Password>${this.password}</wsse:Password>
//          </wsse:UsernameToken>
//       </wsse:Security>
//    </soapenv:Header>
//    <soapenv:Body>
//       <ser:getStatus>
//          <ticket>${ticket}</ticket>
//       </ser:getStatus>
//    </soapenv:Body>
// </soapenv:Envelope>`;

//       const response = await axios.post(this.url, envelope, {
//         headers: {
//           'Content-Type': 'text/xml; charset=utf-8',
//           SOAPAction: 'urn:getStatus',
//         },
//         timeout: 30000,
//         maxBodyLength: Infinity,
//         maxContentLength: Infinity,
//         validateStatus: () => true,
//       });

//       const xml = response.data;

//       // Ver si SUNAT devolvió un Fault
//       const faultCode = xml.match(/<faultcode>(.*?)<\/faultcode>/)?.[1];
//       const faultString = xml.match(/<faultstring>(.*?)<\/faultstring>/)?.[1];
//       if (faultCode || faultString) {
//         throw new Error(
//           JSON.stringify({
//             code: faultCode || '99',
//             message: faultString || 'Error desconocido en SUNAT',
//           }),
//         );
//       }

//       // Extraer statusCode
//       const codeMatch = xml.match(/<statusCode>(.*?)<\/statusCode>/);
//       const statusCode = codeMatch ? codeMatch[1] : '99';

//       // Extraer contenido
//       const contentMatch = xml.match(/<content>([\s\S]*?)<\/content>/);
//       let statusMessage = 'SUNAT no devolvió mensaje';
//       let cdr: Buffer | undefined;

//       if (contentMatch) {
//         const content = contentMatch[1].trim();
//         const isBase64 = /^[A-Za-z0-9+/=]+$/.test(content);

//         if (isBase64) {
//           // Caso exitoso → CDR
//           cdr = Buffer.from(content, 'base64');
//           statusMessage = 'CDR recibido correctamente';
//         } else {
//           // Caso error → mensaje plano
//           throw new Error(
//             JSON.stringify({
//               code: statusCode,
//               message: content,
//             }),
//           );
//         }
//       }

//       // Si existe statusMessage explícito en XML, usarlo
//       const messageMatch = xml.match(/<statusMessage>(.*?)<\/statusMessage>/);
//       if (messageMatch) {
//         statusMessage = messageMatch[1];
//       }
//       const rpta = await this.extraerDatosCdr(cdr);
//       return rpta;
//       //return { statusCode, statusMessage, cdr };
//     } catch (error: any) {
//       console.error('Error en getStatus:', error.message || error);
//       // Propagar hacia arriba con formato uniforme
//       throw error;
//     }
//   }
//   // 🔹 Tu método optimizado de antes
//   async consultarCpe(cp: CpeDto, maxReintentos = 3): Promise<ResultadoCpe> {
//     const intentos = Array.from({ length: maxReintentos }, async () => {
//       const captcha = await this.getCaptchaText();
//       const [serie, correlativoStr] = cp.serieNumero.split('-');
//       const correlativo = parseInt(correlativoStr, 10);
//       const formData = new URLSearchParams();
//       formData.append('accion', 'CapturaCriterioValidez');
//       formData.append('num_ruc', cp.ruc);
//       formData.append('tipocomprobante', cp.tipo === '01' ? '03' : '06');
//       formData.append('num_serie', serie);
//       formData.append('num_comprob', String(correlativo));
//       formData.append('fec_emision', formatDateToDDMMYYYY(cp.fechaEmisionCpe));
//       formData.append('cantidad', cp.monto.toFixed(2));
//       formData.append('codigo', captcha);
//       const resp = (await Promise.race([
//         axios.post(URL_CONSULT, formData.toString(), {
//           headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//           timeout: 300000,
//         }),
//         new Promise((_, reject) =>
//           setTimeout(() => reject(new Error('Timeout interno')), 400000),
//         ),
//       ])) as { data: string };
//       //Parsear con Cheerio
//       const $ = cheerio.load(resp?.data);
//       const mensaje = $('td.bgn').first().text().trim() || 'Sin respuesta';

//       const { codigo, estado } = this.mapearCodigo(mensaje);

//       return {
//         descripcion: mensaje,
//         estado,
//         codigoRespuesta: codigo,
//       };
//     });
//     return Promise.any(intentos);
//   }

//   async extraerDatosCdr(cdrZip: any): Promise<IResponseSunat> {
//     // Descomprimir el ZIP y leer el estado del CDR
//     const zip = new AdmZip(cdrZip);
//     const entries = zip.getEntries();
//     const xmlEntry = entries.find((e) => e.entryName.endsWith('.xml'));
//     if (!xmlEntry) throw new Error('El CDR no contiene XML');
//     const cdrXml = xmlEntry.getData().toString('utf-8');
//     const cdrJson = await parseStringPromise(cdrXml, { explicitArray: false });
//     const responseCode =
//       cdrJson['ar:ApplicationResponse']['cac:DocumentResponse']['cac:Response'][
//         'cbc:ResponseCode'
//       ];
//     const description =
//       cdrJson['ar:ApplicationResponse']['cac:DocumentResponse']['cac:Response'][
//         'cbc:Description'
//       ];
//     const notes =
//       cdrJson['ar:ApplicationResponse']['cac:DocumentResponse']['cac:Response'][
//         'cbc:Note'
//       ];
//     // Estado SUNAT
//     const estadoResult = mapResponseCodeToEstado(
//       responseCode,
//       description,
//       notes,
//     );

//     const rpta: IResponseSunat = {
//       estadoSunat: estadoResult.estado,
//       codigoResponse: estadoResult.codigo,
//       mensaje: estadoResult.mensaje,
//       observaciones: estadoResult.observaciones
//         ? Array.isArray(estadoResult.observaciones)
//           ? estadoResult.observaciones
//           : [estadoResult.observaciones]
//         : [],
//       status: true,
//       cdr: cdrZip?.toString('base64'),
//     };
//     return rpta;
//   }
//   private parseSunatResponse(xml: string): string {
//     // Si hay Fault
//     const faultMatch = xml.match(/<soap-env:Fault[\s\S]*?<\/soap-env:Fault>/);
//     if (faultMatch) {
//       const faultCode =
//         xml.match(/<faultcode>(.*?)<\/faultcode>/)?.[1] ?? 'UNKNOWN';
//       const faultString =
//         xml.match(/<faultstring>(.*?)<\/faultstring>/)?.[1] ??
//         'Error desconocido';

//       throw new Error(
//         JSON.stringify({ code: faultCode, message: faultString }),
//       );
//     }

//     // Si hay ticket
//     const match = xml.match(/<ticket>(.*?)<\/ticket>/);
//     if (!match) throw new Error('SUNAT no devolvió ticket');

//     return match[1];
//   }
//   // 1. Descargar captcha y resolver con Tesseract
//   private async getCaptchaText() {
//     const resp = await axios.get(URL_CAPTCHA, { responseType: 'arraybuffer' });
//     const tempFile = path.join(__dirname, 'captcha.jpg');
//     fs.writeFileSync(tempFile, resp.data);

//     const worker = await createWorker('eng'); // ⚠️ a veces es mejor entrenar para números
//     const {
//       data: { text },
//     } = await worker.recognize(tempFile);
//     await worker.terminate();

//     return text.trim();
//   }
//   private mapearCodigo(mensaje: string): { codigo: string; estado: string } {
//     const msg = mensaje.toLowerCase();
//     const msgNormalizado = msg.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
//     if (/valido/i.test(msgNormalizado)) {
//       return { codigo: '00', estado: 'ACEPTADO' };
//     }
//     if (/no existe/i.test(msgNormalizado)) {
//       return { codigo: '01', estado: 'INEXISTENTE' };
//     }
//     if (/anulad/i.test(msgNormalizado)) {
//       return { codigo: '02', estado: 'ANULADO' };
//     }
//     if (/no es valido|no tiene validez|rechazad/i.test(msgNormalizado)) {
//       return { codigo: '03', estado: 'RECHAZADO' };
//     }
//     if (/codigo ingresado es incorrecto|captcha/i.test(msgNormalizado)) {
//       return { codigo: '98', estado: 'CAPTCHA' };
//     }

//     return { codigo: '99', estado: 'ERROR' };
//   }
// }

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import AdmZip from 'adm-zip';
import * as soap from 'soap';
import { parseStringPromise } from 'xml2js';
import { IResponseSunat } from 'src/domain/comprobante/interface/response.sunat.interface';
import {
  formatDateToDDMMYYYY,
  mapResponseCodeToEstado,
} from 'src/util/Helpers';
import { CpeDto } from 'src/domain/comprobante/dto/cpe/ConsultarLoteCpeDto';
import path from 'path';
import { createWorker } from 'tesseract.js';
import * as fs from 'fs';
import * as cheerio from 'cheerio';
import { ErrorCatalogService } from 'src/util/conversion.error';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
import https from 'https';
import { SendCommon } from './common/send-common';
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
  async sendBill(fileName: string, zipBuffer: Buffer, usuario: string, password: string): Promise<IResponseSunat> {
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
  async sendSummary(fileName: string, zipBuffer: Buffer, usuario: string, password: string): Promise<string> {
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
      const response = await axios.post(this.url, envelope, {
        headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
        auth: { username: usuario, password: password },
        validateStatus: () => true,
      });

      return SendCommon.parseSunatResponse(response.data);
    } catch (err: any) {
      console.error(
        'Error en sendSummary:',
        err.response ?? err.message ?? err,
      );
      throw err;
    }
  }

  /** Consultar estado de Resumen (con ticket) → devuelve CDR */
  async getStatus(
    ticket: string,
    usuario: string,
    password: string,
  ): Promise<IResponseSunat> {
    usuario = process.env.SUNAT_ENV === 'prod' ? usuario : this.username;
    password = process.env.SUNAT_ENV === 'prod' ? password : this.password;
    try {
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
          </soapenv:Envelope>`;

      const response = await axios.post(this.url, envelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: 'urn:getStatus',
        },
        timeout: 30000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: () => true,
      });

      const xml = response.data;

      // obtengo error de sunat
      const faultCode = xml.match(/<faultcode>(.*?)<\/faultcode>/)?.[1];
      const faultString = xml.match(/<faultstring>(.*?)<\/faultstring>/)?.[1];
      if (faultCode || faultString) {
        throw SendCommon.buildSunatError(
          faultCode ?? '99',
          faultString ?? 'Error desconocido en SUNAT',
        );
      }
      const statusCode =
        xml.match(/<statusCode>(.*?)<\/statusCode>/)?.[1] ?? '99';
      const contentMatch = xml.match(/<content>([\s\S]*?)<\/content>/);

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
    // 🔑 Usuario y clave SOL
    const username = '20600887735SOROVECA'; // En producción sería RUC+UsuarioSOL
    const password = 'ambitinbe'; // En producción tu clave SOL
    const [serie, correlativoStr] = data.serieNumero.split('-');
    const correlativo = parseInt(correlativoStr, 10);
    // 🔖 Datos del comprobante
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

      // 👉 Extraer statusCode y statusMessage
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
      if (error instanceof HttpException) {
        throw error;
      }
      throw SendCommon.buildSunatError(
        'SUNAT_INTERNAL_ERROR',
        (error as Error).message,
      );
    }
  }
}
