import { Injectable } from '@nestjs/common';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
import { IResponseSunat } from 'src/domain/comprobante/interface/response.sunat.interface';
import { mapResponseCodeToEstado } from 'src/util/Helpers';

@Injectable()
export class SunatService {
  private readonly url: string;
  private readonly username: string;
  private readonly password: string;

  constructor() {
    // Cambia según el ambiente
    this.url =
      process.env.SUNAT_ENV === 'prod'
        ? 'https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService'
        : 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService';

    this.username = process.env.SUNAT_USER || '20000000001MODDATOS'; // pruebas
    this.password = process.env.SUNAT_PASSWORD || 'moddatos'; // pruebas
  }

  /** Enviar comprobante individual (Factura/Boleta/NC/ND) */
  async sendBill(fileName: string, zipBuffer: Buffer): Promise<IResponseSunat> {
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
        auth: {
          username: this.username,
          password: this.password,
        },
        validateStatus: () => true, // 👈 evita que Axios lance error en 500
      });

      // Buscar si hay Fault en el response
      const faultMatch = response.data.match(
        /<soap-env:Fault[\s\S]*?<\/soap-env:Fault>/,
      );
      if (faultMatch) {
        const faultCodeMatch = response.data.match(
          /<faultcode>(.*?)<\/faultcode>/,
        );
        const faultStringMatch = response.data.match(
          /<faultstring>(.*?)<\/faultstring>/,
        );

        const error = {
          code: faultCodeMatch ? faultCodeMatch[1] : 'UNKNOWN',
          message: faultStringMatch ? faultStringMatch[1] : 'Error desconocido',
        };

        // Aquí lo guardas en DB o lo retornas
        throw new Error(JSON.stringify(error));
      }
      // Si no hay Fault, buscar applicationResponse
      const match = response.data.match(
        /<applicationResponse>([\s\S]*?)<\/applicationResponse>/,
      );
      if (!match) {
        throw new Error('SUNAT no devolvió CDR');
      }
      const cdrZip = Buffer.from(match[1], 'base64');
      const rpta = await this.extraerDatosCdr(cdrZip);
      return rpta;
    } catch (err) {
      console.error('Error SUNAT:', err.message || err);
      throw err;
    }
  }

  /** Enviar Resumen (Boletas diarias, bajas, etc.) → devuelve ticket */
  async sendSummary(fileName: string, zipBuffer: Buffer): Promise<string> {
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
        auth: { username: this.username, password: this.password },
      });
      return this.parseSunatResponse(response.data);
    } catch (err) {
      if (err.response && err.response.data) {
        // Caso SUNAT devolvió SOAP Fault con 500
        return this.parseSunatResponse(err.response.data);
      }
      console.error('Error inesperado:', err.message || err);
      throw err;
    }
  }

  /** Consultar estado de Resumen (con ticket) → devuelve CDR */

  /** Consultar estado de Resumen (con ticket) → devuelve CDR */
  async getStatus(ticket: string): Promise<IResponseSunat> {
    try {
      const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://service.sunat.gob.pe"
                  xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
   <soapenv:Header>
      <wsse:Security>
         <wsse:UsernameToken>
            <wsse:Username>${this.username}</wsse:Username>
            <wsse:Password>${this.password}</wsse:Password>
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

      // Ver si SUNAT devolvió un Fault
      const faultCode = xml.match(/<faultcode>(.*?)<\/faultcode>/)?.[1];
      const faultString = xml.match(/<faultstring>(.*?)<\/faultstring>/)?.[1];
      if (faultCode || faultString) {
        throw new Error(
          JSON.stringify({
            code: faultCode || '99',
            message: faultString || 'Error desconocido en SUNAT',
          }),
        );
      }

      // Extraer statusCode
      const codeMatch = xml.match(/<statusCode>(.*?)<\/statusCode>/);
      const statusCode = codeMatch ? codeMatch[1] : '99';

      // Extraer contenido
      const contentMatch = xml.match(/<content>([\s\S]*?)<\/content>/);
      let statusMessage = 'SUNAT no devolvió mensaje';
      let cdr: Buffer | undefined;

      if (contentMatch) {
        const content = contentMatch[1].trim();
        const isBase64 = /^[A-Za-z0-9+/=]+$/.test(content);

        if (isBase64) {
          // Caso exitoso → CDR
          cdr = Buffer.from(content, 'base64');
          statusMessage = 'CDR recibido correctamente';
        } else {
          // Caso error → mensaje plano
          throw new Error(
            JSON.stringify({
              code: statusCode,
              message: content,
            }),
          );
        }
      }

      // Si existe statusMessage explícito en XML, usarlo
      const messageMatch = xml.match(/<statusMessage>(.*?)<\/statusMessage>/);
      if (messageMatch) {
        statusMessage = messageMatch[1];
      }
      const rpta = await this.extraerDatosCdr(cdr);
      return rpta;
      //return { statusCode, statusMessage, cdr };

    } catch (error: any) {
      console.error('Error en getStatus:', error.message || error);
      // Propagar hacia arriba con formato uniforme
      throw error;
    }
  }

  async extraerDatosCdr(cdrZip: any): Promise<IResponseSunat> {
    // Descomprimir el ZIP y leer el estado del CDR
    const zip = new AdmZip(cdrZip);
    const entries = zip.getEntries();
    const xmlEntry = entries.find((e) => e.entryName.endsWith('.xml'));
    if (!xmlEntry) throw new Error('El CDR no contiene XML');
    const cdrXml = xmlEntry.getData().toString('utf-8');
    const cdrJson = await parseStringPromise(cdrXml, { explicitArray: false });
    const responseCode =
      cdrJson['ar:ApplicationResponse']['cac:DocumentResponse']['cac:Response'][
        'cbc:ResponseCode'
      ];
    const description =
      cdrJson['ar:ApplicationResponse']['cac:DocumentResponse']['cac:Response'][
        'cbc:Description'
      ];
    const notes =
      cdrJson['ar:ApplicationResponse']['cac:DocumentResponse']['cac:Response'][
        'cbc:Note'
      ];
    // Estado SUNAT
    const estadoResult = mapResponseCodeToEstado(
      responseCode,
      description,
      notes,
    );

    const rpta: IResponseSunat = {
      estadoSunat: estadoResult.estado,
      codigoResponse: estadoResult.codigo,
      mensaje: estadoResult.mensaje,
      observaciones: estadoResult.observaciones
        ? Array.isArray(estadoResult.observaciones)
          ? estadoResult.observaciones
          : [estadoResult.observaciones]
        : [],
      status: true,
      cdr: cdrZip?.toString('base64'),
    };
    return rpta;
  }
  private parseSunatResponse(xml: string): string {
    // Si hay Fault
    const faultMatch = xml.match(/<soap-env:Fault[\s\S]*?<\/soap-env:Fault>/);
    if (faultMatch) {
      const faultCode =
        xml.match(/<faultcode>(.*?)<\/faultcode>/)?.[1] ?? 'UNKNOWN';
      const faultString =
        xml.match(/<faultstring>(.*?)<\/faultstring>/)?.[1] ??
        'Error desconocido';

      throw new Error(
        JSON.stringify({ code: faultCode, message: faultString }),
      );
    }

    // Si hay ticket
    const match = xml.match(/<ticket>(.*?)<\/ticket>/);
    if (!match) throw new Error('SUNAT no devolvió ticket');

    return match[1];
  }
}
