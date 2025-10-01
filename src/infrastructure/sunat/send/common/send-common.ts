import { HttpException, HttpStatus } from "@nestjs/common";
import AdmZip from "adm-zip";
import axios from "axios";
import path from "path";
import { IResponseSunat } from "src/domain/comprobante/interface/response.sunat.interface";
import { mapResponseCodeToEstado } from "src/util/Helpers";
import { OrigenErrorEnum } from "src/util/OrigenErrorEnum";
import { parseStringPromise } from "xml2js";
import * as fs from 'fs';
import { createWorker } from "tesseract.js";
export class SendCommon {
  /** Procesar CDR */
  static async extraerDatosCdr(cdrZip: any): Promise<IResponseSunat> {
    if (!cdrZip)
      throw this.buildSunatError('ERR_NOZIP', 'El CDR no contiene XML');

    const zip = new AdmZip(cdrZip);
    const entries = zip.getEntries();
    const xmlEntry = entries.find((e) => e.entryName.endsWith('.xml'));
    if (!xmlEntry)
      throw this.buildSunatError('ERR_NOXML', 'El CDR no contiene XML');

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

    const estadoResult = mapResponseCodeToEstado(
      responseCode,
      description,
      notes,
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
      cdr: cdrZip?.toString('base64'),
    };
  }

  /** Parsear respuesta de SUNAT para ticket */
  static parseSunatResponse(xml: string): string {
    const faultMatch = xml.match(/<soap-env:Fault[\s\S]*?<\/soap-env:Fault>/);
    if (faultMatch) {
      const faultCode =
        xml.match(/<faultcode>(.*?)<\/faultcode>/)?.[1] ?? 'UNKNOWN';
      const faultString =
        xml.match(/<faultstring>(.*?)<\/faultstring>/)?.[1] ??
        'Error desconocido';
      throw this.buildSunatError(faultCode, faultString);
    }

    const match = xml.match(/<ticket>(.*?)<\/ticket>/);
    if (!match)
      throw this.buildSunatError('ERR_NOTICKET', 'SUNAT no devolvió ticket');

    return match[1];
  }

  /** Resolver captcha con Tesseract */
  static async getCaptchaText(URL_CAPTCHA: string) {
    const resp = await axios.get(URL_CAPTCHA, { responseType: 'arraybuffer' });
    const tempFile = path.join(__dirname, 'captcha.jpg');
    fs.writeFileSync(tempFile, resp.data);

    const worker = await createWorker('eng');
    const {
      data: { text },
    } = await worker.recognize(tempFile);
    await worker.terminate();

    return text?.trim();
  }

  /** Mapear mensaje portal SUNAT */
  static mapearCodigo(mensaje: string): { codigo: string; estado: string } {
    const msgNormalizado = mensaje
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    if (/valido/i.test(msgNormalizado))
      return { codigo: '00', estado: 'ACEPTADO' };
    if (/no existe/i.test(msgNormalizado))
      return { codigo: '01', estado: 'INEXISTENTE' };
    if (/anulad/i.test(msgNormalizado))
      return { codigo: '02', estado: 'ANULADO' };
    if (/no es valido|no tiene validez|rechazad/i.test(msgNormalizado))
      return { codigo: '03', estado: 'RECHAZADO' };
    if (/codigo ingresado es incorrecto|captcha/i.test(msgNormalizado))
      return { codigo: '98', estado: 'CAPTCHA' };
    return { codigo: '99', estado: 'ERROR' };
  }
    /** Helper para construir errores uniformes */
  static buildSunatError(
    code: string,
    message: string,
    status: number = HttpStatus.BAD_REQUEST,
  ) {
    return new HttpException(
      {
        success: false,
        origen: OrigenErrorEnum.SUNAT,
        code,
        message,
      },
      status,
    );
  }
}
