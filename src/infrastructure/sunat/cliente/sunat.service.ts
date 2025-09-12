// import { Injectable } from '@nestjs/common';
// import * as soap from 'soap';

// @Injectable()
// export class SunatService {
//   private wsdlUrl = 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService?wsdl';

//   async enviarComprobante(fileName: string, zipBuffer: Buffer) {
//     // 1. Crear cliente SOAP
//     const client = await soap.createClientAsync(this.wsdlUrl);

//     // 2. Credenciales de pruebas SUNAT
//     client.setSecurity(
//       new soap.BasicAuthSecurity('20000000001MODDATOS', 'moddatos'),
//     );

//     // 3. Armar request
//     const request = {
//       fileName: fileName, // ejemplo: 20542245672-03-B001-1.zip
//       contentFile: zipBuffer.toString('base64'),
//     };
//     console.log("request ", request)
//     // 4. Enviar factura
//     const [result] = await client.sendBillAsync(request);

//     // 5. Obtener y decodificar CDR
//     const cdrBase64 = result.applicationResponse;
//     if (!cdrBase64) {
//       throw new Error('SUNAT no devolvió CDR');
//     }

//     const cdrZip = Buffer.from(cdrBase64, 'base64');
//     return cdrZip; // ZIP con el CDR
//   }
// }
// import { Injectable } from '@nestjs/common';
// import * as soap from 'soap';
// import * as path from 'path';
// @Injectable()
// export class SunatService {

//    private wsdlPath: string;

//   constructor() {
//     this.wsdlPath =
//       process.env.SUNAT_ENV === 'prod'
//         ? path.join(__dirname, '../../../resources/wsdl/prod/billService.wsdl')
//         : path.join(__dirname, '../../../resources/wsdl/beta/billService.wsdl');
//   }

//   private readonly username =
//     process.env.SUNAT_USER || '20000000001MODDATOS'; // pruebas
//   private readonly password =
//     process.env.SUNAT_PASSWORD || 'moddatos'; // pruebas

// async sendBill(fileName: string, zipBuffer: Buffer) {
//   const client = await soap.createClientAsync(this.wsdlPath);
//   client.setSecurity(new soap.BasicAuthSecurity(this.username, this.password));

//   const [result] = await client.sendBillAsync({
//     fileName,
//     contentFile: zipBuffer.toString('base64'),
//   });

//   return result;
// }

  // async sendSummary(fileName: string, zipBuffer: Buffer): Promise<string> {
  //   return new Promise((resolve, reject) => {
  //     soap.createClient(this.wsdlUrl, {}, (err: any, client: any) => {
  //       if (err) {
  //         return reject(err);
  //       }

  //       client.setSecurity(new soap.BasicAuthSecurity(this.username, this.password));

  //       const args = {
  //         fileName,
  //         contentFile: zipBuffer.toString('base64'),
  //       };

  //       client.sendSummary(args, (err: any, result: any) => {
  //         if (err) {
  //           return reject(err);
  //         }
  //         const ticket = result?.ticket;
  //         if (!ticket) {
  //           return reject(new Error('SUNAT no devolvió ticket.'));
  //         }
  //         resolve(ticket);
  //       });
  //     });
  //   });
  // }

  // async getStatus(ticket: string): Promise<Buffer> {
  //   return new Promise((resolve, reject) => {
  //     soap.createClient(this.wsdlUrl, {}, (err: any, client: any) => {
  //       if (err) {
  //         return reject(err);
  //       }

  //       client.setSecurity(new soap.BasicAuthSecurity(this.username, this.password));

  //       client.getStatus({ ticket }, (err: any, result: any) => {
  //         if (err) {
  //           return reject(err);
  //         }

  //         const cdrBase64 = result?.status?.content;
  //         if (!cdrBase64) {
  //           return reject(new Error('SUNAT no devolvió CDR en getStatus.'));
  //         }
  //         resolve(Buffer.from(cdrBase64, 'base64'));
  //       });
  //     });
  //   });
  // }

import { Injectable } from '@nestjs/common';
import axios from 'axios';

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
 async sendBill(fileName: string, zipBuffer: Buffer) {
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
          username: process.env.SUNAT_USER!,
          password: process.env.SUNAT_PASSWORD!,
        },
        validateStatus: () => true, // 👈 evita que Axios lance error en 500
      });

      // Buscar si hay Fault en el response
      const faultMatch = response.data.match(/<soap-env:Fault[\s\S]*?<\/soap-env:Fault>/);
      if (faultMatch) {
        const faultCodeMatch = response.data.match(/<faultcode>(.*?)<\/faultcode>/);
        const faultStringMatch = response.data.match(/<faultstring>(.*?)<\/faultstring>/);

        const error = {
          code: faultCodeMatch ? faultCodeMatch[1] : 'UNKNOWN',
          message: faultStringMatch ? faultStringMatch[1] : 'Error desconocido',
        };

        // Aquí lo guardas en DB o lo retornas
        throw new Error(JSON.stringify(error));
      }

      // Si no hay Fault, buscar applicationResponse
      const match = response.data.match(/<applicationResponse>([\s\S]*?)<\/applicationResponse>/);
      if (!match) {
        throw new Error('SUNAT no devolvió CDR');
      }

      return Buffer.from(match[1], 'base64'); // ZIP del CDR
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

    const response = await axios.post(this.url, envelope, {
      headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
      auth: { username: this.username, password: this.password },
    });

    const match = response.data.match(/<ticket>(.*?)<\/ticket>/);
    if (!match) throw new Error('SUNAT no devolvió ticket');
    return match[1];
  }

  /** Consultar estado de Resumen (con ticket) → devuelve CDR */
  async getStatus(ticket: string): Promise<Buffer> {
    const envelope = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://service.sunat.gob.pe">
       <soapenv:Header/>
       <soapenv:Body>
          <ser:getStatus>
             <ticket>${ticket}</ticket>
          </ser:getStatus>
       </soapenv:Body>
    </soapenv:Envelope>`;

    const response = await axios.post(this.url, envelope, {
      headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
      auth: { username: this.username, password: this.password },
    });

    const match = response.data.match(/<content>([\s\S]*?)<\/content>/);
    if (!match) throw new Error('SUNAT no devolvió CDR en getStatus');
    return Buffer.from(match[1], 'base64');
  }
}
