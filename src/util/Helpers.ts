import { BadRequestException } from '@nestjs/common';
import {
  CodigoProductoNotaDebito,
  TIPO_AFECTACION_EXONERADAS,
  TIPO_AFECTACION_GRAVADAS,
  TIPO_AFECTACION_INAFECTAS,
  TipoAumentoNotaDebito,
  TipoComprobanteEnum,
  TipoDocumentoIdentidadEnum,
  TipoDocumentoLetras,
} from './catalogo.enum';
import { CreateClienteDto } from '../domain/cliente/dto/CreateRequestDto';
import { UpdateClienteDto } from '../domain/cliente/dto/UpdateClienteDto';
import { DOMParser } from '@xmldom/xmldom';
import { EstadoEnumComprobante } from './estado.enum';
import { EstadoCdrResult } from 'src/domain/comprobante/interface/estado.cdr.interface';
import { parseStringPromise } from 'xml2js';
import { IUpdateComprobante } from 'src/domain/comprobante/interface/update.interface';
import { IMtoGloables } from 'src/domain/comprobante/interface/mtos-globales';
import { DetailDto } from 'src/domain/comprobante/dto/base/DetailDto';
import { convertirMontoEnLetras } from './conversion-numero-letra';
import { ComprobanteResponseDto } from 'src/domain/comprobante/dto/ConprobanteResponseDto';
export type TipoNotaDebito = 'GLOBAL' | 'ITEM' | 'INVALIDO';

export function validarSoloNumeros(
  valor: string,
  longitud: number,
  mensaje: string,
) {
  const regex = new RegExp(`^\\d{${longitud}}$`);
  if (!regex.test(valor)) {
    throw new BadRequestException(mensaje);
  }
}

export function validarLongitudMinima(
  valor: string,
  longitud: number,
  mensaje: string,
) {
  if (!valor || valor.length < longitud) {
    throw new BadRequestException(mensaje);
  }
}
export function validarDatosSegunTipoDocumento(
  cliente: CreateClienteDto | UpdateClienteDto,
) {
  const numeroDocumento = cliente.numeroDocumento ?? '';
  switch (cliente.tipoDocumento) {
    case TipoDocumentoIdentidadEnum.DNI:
      validarSoloNumeros(
        numeroDocumento,
        8,
        'El DNI debe tener 8 dígitos numéricos',
      );
      if (!cliente.nombre) {
        throw new BadRequestException('El nombre del cliente es obligatorio');
      }
      if (!cliente.apellidoPaterno || !cliente.apellidoMaterno) {
        throw new BadRequestException('Los apellidos son obligatorios');
      }
      break;

    case TipoDocumentoIdentidadEnum.RUC:
      validarSoloNumeros(
        numeroDocumento,
        11,
        'El RUC debe tener 11 dígitos numéricos',
      );
      if (!cliente.razonSocial) {
        throw new BadRequestException(
          'La razón social del cliente es obligatoria',
        );
      }
      break;

    case TipoDocumentoIdentidadEnum.CARNET_EXTRANJERIA:
      validarLongitudMinima(
        numeroDocumento,
        6,
        'El Carnet de extranjería es demasiado corto',
      );
      break;

    case TipoDocumentoIdentidadEnum.PASAPORTE:
      validarLongitudMinima(
        numeroDocumento,
        6,
        'El pasaporte es demasiado corto',
      );
      break;

    case TipoDocumentoIdentidadEnum.CEDULA_DIPLOMATICA:
      validarLongitudMinima(
        numeroDocumento,
        6,
        'La cédula diplomática es demasiado corta',
      );
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

export function getTicketFromResponse(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const ticketNode = doc.getElementsByTagName('ticket')[0];
  return ticketNode?.textContent || '';
}

export function mapResponseCodeToEstado(
  responseCode: string,
  description: string,
  notes?: string | string[] | null,
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

export async function extraerHashCpe(
  xmlFirmado: string,
): Promise<string | null> {
  if (!xmlFirmado) return null;
  const json = await parseStringPromise(xmlFirmado, { explicitArray: false });
  const digestValue =
    json['Invoice']?.['ext:UBLExtensions']?.['ext:UBLExtension']?.[
      'ext:ExtensionContent'
    ]?.['ds:Signature']?.['ds:SignedInfo']?.['ds:Reference']?.[
      'ds:DigestValue'
    ];
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

export function buildMtoGlobales(mto: any): IMtoGloables[] {
  const iMtoGlobalesGravadas: IMtoGloables = {
    mtoOperacion: mto?.mtoOperGravadas ?? 0,
    tipo: TIPO_AFECTACION_GRAVADAS,
  };

  const iMtoGlobalesExoneradas: IMtoGloables = {
    mtoOperacion: mto?.mtoOperExoneradas ?? 0,
    tipo: TIPO_AFECTACION_EXONERADAS,
  };

  const iMtoGlobalesInafectas: IMtoGloables = {
    mtoOperacion: mto?.mtoOperInafectas ?? 0,
    tipo: TIPO_AFECTACION_INAFECTAS,
  };

  return [iMtoGlobalesGravadas, iMtoGlobalesExoneradas, iMtoGlobalesInafectas];
}
export function sonMontosCero(...montos: number[]): boolean {
  return montos.every((m) => m === 0);
}
export function calcularMora(
  montoPendiente: number,
  tasaAnual: number,
  fechaVencimiento: Date,
  fechaPago: Date,
): number {
  if (!montoPendiente || montoPendiente <= 0) return 0;

  const msPorDia = 1000 * 60 * 60 * 24;
  const diasAtraso = Math.max(
    0,
    Math.floor((fechaPago.getTime() - fechaVencimiento.getTime()) / msPorDia),
  );

  if (diasAtraso === 0) return 0;

  const tasaDiaria = tasaAnual / 100 / 360;
  const mora = montoPendiente * tasaDiaria * diasAtraso;

  return parseFloat(mora.toFixed(2));
}

export function identificarTipoAumentoNotaDebito(
  facturaOriginal: DetailDto[],
  notaDebito: DetailDto[],
): TipoNotaDebito {
  if (!notaDebito || notaDebito.length === 0) {
    throw new BadRequestException('La nota de débito no tiene detalles');
  }

  // Caso 1: Aumento global → exactamente 1 item con AU001
  if (
    notaDebito.length === 1 &&
    notaDebito[0].codProducto ===
      CodigoProductoNotaDebito.AJUSTE_GLOBAL_OPERACION
  ) {
    return TipoAumentoNotaDebito.GLOBAL;
  }

  // Caso 2: Aumento por ítem → todos deben existir en la factura original
  const codigosFactura = facturaOriginal.map((d) => d.codProducto);
  const todosExisten = notaDebito.every((d) =>
    codigosFactura.includes(d.codProducto),
  );

  if (todosExisten) {
    return TipoAumentoNotaDebito.ITEM;
  }
  // Caso 3: Inválido → mezcla de AU001 + productos o productos inexistentes
  throw new BadRequestException(
    'Nota de débito inválida: el detalle contiene códigos de producto que no existen en la factura original o una mezcla de ajuste global con ítems específicos.',
  );
}

export function validateLegends(
  legends: { code: string; value: string }[],
  mtoImpVentaEsperado: number,
) {
  if (!legends || legends.length === 0) {
    throw new BadRequestException(
      `La Nota es inválida: debe incluir al menos la leyenda de monto en letras (code=1000).`,
    );
  }

  const legendMonto = legends.find((l) => l.code === '1000');
  if (!legendMonto) {
    throw new BadRequestException(
      `La Nota es inválida: falta la leyenda obligatoria de monto en letras (code=1000).`,
    );
  }

  const montoEnLetrasEsperado = convertirMontoEnLetras(mtoImpVentaEsperado);

  if (
    legendMonto.value.trim().toUpperCase() !==
    montoEnLetrasEsperado.trim().toUpperCase()
  ) {
    throw new BadRequestException(
      `La leyenda de monto en letras no coincide con el total calculado. 
      Esperado "${montoEnLetrasEsperado}", recibido "${legendMonto.value}".`,
    );
  }

  return true; // Legends válidas
}

export function validateCodigoProductoNotaDebito(
  tipoNotaDebito: string, // código SUNAT: "01", "02", "03"
  codProducto: string, // código enviado en el detalle
  existeEnFactura: boolean = false, // aplica solo para ND 02 por ítem
): void {
  switch (tipoNotaDebito) {
    case '01': // Intereses por mora
      if (codProducto !== CodigoProductoNotaDebito.INTERES_POR_MORA) {
        throw new BadRequestException(
          `El código de producto ${codProducto} no es válido para una Nota de Débito por Mora. Debe ser ${CodigoProductoNotaDebito.INTERES_POR_MORA}.`,
        );
      }
      break;

    case '02': // Aumento en el valor
      if (
        codProducto !== CodigoProductoNotaDebito.AJUSTE_GLOBAL_OPERACION &&
        !existeEnFactura
      ) {
        throw new BadRequestException(
          `El código de producto ${codProducto} no es válido para una Nota de Débito por Aumento. 
          Debe ser ${CodigoProductoNotaDebito.AJUSTE_GLOBAL_OPERACION} (ajuste global) o un producto existente en la factura original.`,
        );
      }
      break;

    case '03': // Penalidades
      if (codProducto !== CodigoProductoNotaDebito.PENALIDAD_CONTRATO) {
        throw new BadRequestException(
          `El código de producto ${codProducto} no es válido para una Nota de Débito por Penalidad. Debe ser ${CodigoProductoNotaDebito.PENALIDAD_CONTRATO}.`,
        );
      }
      break;

    default:
      throw new BadRequestException(
        `Tipo de Nota de Débito ${tipoNotaDebito} no soportado para validación de códigos.`,
      );
  }
}

/**
 * Valida que el comprobante original tenga un único tipo de afectación IGV
 * y retorna dicho tipo.
 *
 * @throws BadRequestException si existen múltiples tipos de afectación en la factura original
 */
export function validarTipoAfectacionUnico(details: DetailDto[]): any {
  const tiposAfeOriginales = [...new Set(details.map((d) => d.tipAfeIgv))];

  if (tiposAfeOriginales.length > 1) {
    throw new BadRequestException(
      `El comprobante original contiene ítems con diferentes tipos de afectación IGV (${tiposAfeOriginales.join(
        ', ',
      )}). No es posible generar una Nota de Débito global.`,
    );
  }

  return tiposAfeOriginales[0];
}

export function buildMensajeRecalculo(tipo: TipoDocumentoLetras): string {
  return `La ${tipo} debe enviarse con los montos correctos o, en su defecto, envíe con los montos en cero para que el sistema los recalcule.`;
}
export function validarNumeroDocumentoCliente(
  tipo: TipoDocumentoLetras,
  numDocNd: string,
  numDocOriginal: string,
) {
  // 1. Validar cliente
  if (numDocNd !== numDocOriginal) {
    throw new BadRequestException(
      `El RUC/DNI del cliente en la ${tipo} (${numDocNd}) no coincide con el de la factura original (${numDocOriginal}).`,
    );
  }
}
