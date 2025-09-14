import { BadRequestException } from "@nestjs/common";
import { TipoComprobanteEnum, TipoDocumentoIdentidadEnum } from "./catalogo.enum";
import { CreateClienteDto } from "../domain/cliente/dto/CreateRequestDto";
import { UpdateClienteDto } from "../domain/cliente/dto/UpdateClienteDto";
import { DOMParser } from '@xmldom/xmldom';
import { EstadoEnumComprobante } from "./estado.enum";
import { EstadoCdrResult } from "src/domain/comprobante/interface/estado.cdr.interface";
import { parseStringPromise } from 'xml2js';
import { IUpdateComprobante } from "src/domain/comprobante/interface/update.interface";
export function validarSoloNumeros(valor: string, longitud: number, mensaje: string) {
  const regex = new RegExp(`^\\d{${longitud}}$`);
  if (!regex.test(valor)) {
    throw new BadRequestException(mensaje);
  }
}

export function validarLongitudMinima(valor: string, longitud: number, mensaje: string) {
  if (!valor || valor.length < longitud) {
    throw new BadRequestException(mensaje);
  }
}
export function validarDatosSegunTipoDocumento(cliente: CreateClienteDto | UpdateClienteDto) {
  const numeroDocumento = cliente.numeroDocumento ?? ""
  switch (cliente.tipoDocumento) {

    case TipoDocumentoIdentidadEnum.DNI:
      validarSoloNumeros(numeroDocumento, 8, 'El DNI debe tener 8 dígitos numéricos');
      if (!cliente.nombre) {
        throw new BadRequestException('El nombre del cliente es obligatorio');
      }
      if (!cliente.apellidoPaterno || !cliente.apellidoMaterno) {
        throw new BadRequestException('Los apellidos son obligatorios');
      }
      break;

    case TipoDocumentoIdentidadEnum.RUC:
      validarSoloNumeros(numeroDocumento, 11, 'El RUC debe tener 11 dígitos numéricos');
      if (!cliente.razonSocial) {
        throw new BadRequestException('La razón social del cliente es obligatoria');
      }
      break;

    case TipoDocumentoIdentidadEnum.CARNET_EXTRANJERIA:
      validarLongitudMinima(numeroDocumento, 6, 'El Carnet de extranjería es demasiado corto');
      break;

    case TipoDocumentoIdentidadEnum.PASAPORTE:
      validarLongitudMinima(numeroDocumento, 6, 'El pasaporte es demasiado corto');
      break;

    case TipoDocumentoIdentidadEnum.CEDULA_DIPLOMATICA:
      validarLongitudMinima(numeroDocumento, 6, 'La cédula diplomática es demasiado corta');
      break;

    case TipoDocumentoIdentidadEnum.DOC_TRIB_NO_DOM_SIN_RUC:
      // no se valida longitud
      break;

    default:
      throw new BadRequestException('Tipo de documento no soportado');
  }
}
/**
 * Convierte una fecha en formato YYYY-MM-DD o un objeto Date
 * al formato compacto YYYYMMDD (ej: 20250911).
 */
export function formatDateToCompact(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0'); // meses van de 0 a 11
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

export function  getTicketFromResponse(xml: string): string {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const ticketNode = doc.getElementsByTagName('ticket')[0];
    return ticketNode?.textContent || '';
}


export function mapResponseCodeToEstado(
  responseCode: string,
  description: string,
  notes?: string | string[] | null
): EstadoCdrResult {
  let estado: EstadoEnumComprobante;

  if (responseCode === '0') {
    estado = notes
      ? EstadoEnumComprobante.OBSERVADO
      : EstadoEnumComprobante.ACEPTADO;
  } else if (Number(responseCode) >= 1000 && Number(responseCode) < 2000) {
    estado = EstadoEnumComprobante.ERROR;
  } else if (Number(responseCode) >= 2000 && Number(responseCode) < 4000) {
    estado = EstadoEnumComprobante.RECHAZADO;
  } else {
    estado = EstadoEnumComprobante.PENDIENTE;
  }

  return {
    estado,
    codigo: responseCode,
    mensaje: description,
    observaciones: notes || null,
  };
}

export async function extraerHashCpe(xmlFirmado: string): Promise<string | null> {
  if(!xmlFirmado) return null
  const json = await parseStringPromise(xmlFirmado, { explicitArray: false });
  const digestValue =
    json['Invoice']?.['ext:UBLExtensions']?.['ext:UBLExtension']?.['ext:ExtensionContent']
      ?.['ds:Signature']?.['ds:SignedInfo']?.['ds:Reference']?.['ds:DigestValue'];
  return digestValue || null;
}
export function setobjectUpdateComprobante(
    tipoComprobante: TipoComprobanteEnum,
    xmlFirmado: string,
    cdr: string | null,
    hashCpe: string | null,
    estado: EstadoEnumComprobante,
    motivoEstado: string,
  ): IUpdateComprobante {
    const objectUpdate: IUpdateComprobante = {
      xmlFirmado,
      estado,
      motivoEstado,
    };
    // Solo comprobantes que sí necesitan CDR y Hash
    const tiposConCdrYHash: TipoComprobanteEnum[] = [
      TipoComprobanteEnum.FACTURA,
      TipoComprobanteEnum.NOTA_CREDITO,
      TipoComprobanteEnum.NOTA_DEBITO,
    ];
    if (tiposConCdrYHash.includes(tipoComprobante)) {
      objectUpdate.cdr = cdr;
      objectUpdate.hashCpe = hashCpe;
    }
    return objectUpdate;
  }
