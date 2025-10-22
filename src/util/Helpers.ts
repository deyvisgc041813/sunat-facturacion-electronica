
import {
  CodigoProductoNotaDebito,
  LegendCodeEnum,
  TipoAumentoNotaDebito,
  TipoCatalogoEnum,
  TipoComprobanteEnum,
  TipoDocumentoIdentidadEnum,
  TipoDocumentoLetras,
} from './catalogo.enum';
import { DOMParser } from '@xmldom/xmldom';
import {
  codigoRespuestaSunatMap,
  EstadoComprobanteEnumSunat,
  EstadoEnumComprobante,
  EstadoEnvioSunat,
} from './estado.enum';
import { parseStringPromise } from 'xml2js';
import { convertirMontoEnLetras } from './conversion-numero-letra';
export type TipoNotaDebito = 'GLOBAL' | 'ITEM' | 'INVALIDO';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { TRIBUTOS_RESUMEN } from './constantes';
import { Plan } from './general.enum';
import { UpdateClienteDto } from 'src/domain/parent/cliente/dto/update.client.dto';
import { CreateClienteDto } from 'src/domain/parent/cliente/dto/create.client.dto';
import { EstadoCdrResult } from 'src/domain/tenant/comprobante/interface/estado.cdr.interface';
import { IUpdateComprobante } from 'src/domain/tenant/comprobante/interface/update.interface';
import { IMtoGloables } from 'src/domain/tenant/comprobante/interface/mtos-globales';
import { DetailDto } from 'src/domain/tenant/comprobante/dto/base/detail.dto';
import { IDocumento } from 'src/domain/tenant/resumen/interface/sunat.summary.interface';
import { ResponseCatalogoTipoDTO } from 'src/domain/parent/catalogo/dto/catalogo.response';
import { BusinessLogicException } from 'src/adapter/web/exception/exeception-dynamic';

dayjs.extend(utc);
dayjs.extend(timezone);

export function validarSoloNumeros(
  valor: string,
  longitud: number,
  mensaje: string,
) {
  const regex = new RegExp(`^\\d{${longitud}}$`);
  if (!regex.test(valor)) {
    throw new BusinessLogicException(mensaje);
  }
}

export function validarLongitudMinima(
  valor: string,
  longitud: number,
  mensaje: string,
) {
  if (!valor || valor.length < longitud) {
    throw new BusinessLogicException(mensaje);
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
        throw new BusinessLogicException('El nombre del cliente es obligatorio');
      }
      break;

    case TipoDocumentoIdentidadEnum.RUC:
      validarSoloNumeros(
        numeroDocumento,
        11,
        'El RUC debe tener 11 dígitos numéricos',
      );
      if (!cliente.razonSocial) {
        throw new BusinessLogicException(
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
      throw new BusinessLogicException('Tipo de documento no soportado');
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

  // if (responseCode === '0') {
  //   estado = notes  ? EstadoEnumComprobante.OBSERVADO : EstadoEnumComprobante.ACEPTADO;
  // } else if (Number(responseCode) >= 1000 && Number(responseCode) < 2000) {
  //   estado = EstadoEnumComprobante.ERROR;
  // } else if (Number(responseCode) >= 2000 && Number(responseCode) < 4000) {
  //   estado = EstadoEnumComprobante.RECHAZADO;
  // } else {
  //   estado = EstadoEnumComprobante.PENDIENTE;
  // }
  if (responseCode === '0') {
    estado = notes
      ? EstadoEnumComprobante.OBSERVADO // aceptado con advertencias
      : EstadoEnumComprobante.ACEPTADO; // aceptado sin observaciones
  } else if (responseCode === '0001') {
    estado = EstadoEnumComprobante.ACEPTADO;
  } else if (responseCode === '0002') {
    estado = EstadoEnumComprobante.RECHAZADO;
  } else if (responseCode === '0003') {
    estado = EstadoEnumComprobante.OBSERVADO;
  } else if (responseCode === '0004') {
    estado = EstadoEnumComprobante.NO_EXISTE;
  } else if (Number(responseCode) >= 100 && Number(responseCode) < 2000) {
    // 0100–0999 -> Excepciones SUNAT
    // 1000–1999 -> Excepciones del contribuyente
    estado = EstadoEnumComprobante.ERROR;
  } else if (Number(responseCode) >= 2000 && Number(responseCode) < 4000) {
    // Errores que generan rechazo
    estado = EstadoEnumComprobante.RECHAZADO;
  } else if (Number(responseCode) >= 4000) {
    // Observaciones (aceptado con advertencias)
    estado = EstadoEnumComprobante.OBSERVADO;
  } else {
    estado = EstadoEnumComprobante.PENDIENTE; // cualquier otro caso no mapeado
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

  // Detectar el nodo raíz posible
  const root =
    json['Invoice'] ??
    json['CreditNote'] ??
    json['DebitNote'] ??
    json['SummaryDocuments'] ??
    json['VoidedDocuments'];

  if (!root) return null;

  const digestValue =
    root['ext:UBLExtensions']?.['ext:UBLExtension']?.['ext:ExtensionContent']?.[
      'ds:Signature'
    ]?.['ds:SignedInfo']?.['ds:Reference']?.['ds:DigestValue'];

  return digestValue || null;
}

export function setobjectUpdateComprobante(
  tipoComprobante: TipoComprobanteEnum,
  xmlFirmado: string,
  cdr: Buffer | null | undefined,
  hashCpe: string,
  estado: EstadoEnumComprobante,
  descripcionEstado: string,
): IUpdateComprobante {
  const objectUpdate: IUpdateComprobante = {
    xmlFirmado,
    estado,
    descripcionEstado,
  };
  // Solo comprobantes que sí necesitan CDR y Hash
  const tiposConCdrYHash: TipoComprobanteEnum[] = [
    TipoComprobanteEnum.FACTURA,
    TipoComprobanteEnum.NOTA_CREDITO,
    TipoComprobanteEnum.NOTA_DEBITO,
  ];
  if (tiposConCdrYHash.includes(tipoComprobante)) {
    objectUpdate.cdr = cdr;
  }
  objectUpdate.hashCpe = hashCpe;
  return objectUpdate;
}

export function buildMtoGlobales(
  mto: any,
  tipoAfectacionGravadas: number[],
  tipoAfectacionExoneradas: number[],
  tipoAfectacionInafectas: number[],
): IMtoGloables[] {
  const iMtoGlobalesGravadas: IMtoGloables = {
    mtoOperacion: mto?.mtoOperGravadas ?? 0,
    tipo: tipoAfectacionGravadas,
  };

  const iMtoGlobalesExoneradas: IMtoGloables = {
    mtoOperacion: mto?.mtoOperExoneradas ?? 0,
    tipo: tipoAfectacionExoneradas,
  };

  const iMtoGlobalesInafectas: IMtoGloables = {
    mtoOperacion: mto?.mtoOperInafectas ?? 0,
    tipo: tipoAfectacionInafectas,
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
    throw new BusinessLogicException('La nota de débito no tiene detalles');
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
  throw new BusinessLogicException(
    'Nota de débito inválida: el detalle contiene códigos de producto que no existen en la factura original o una mezcla de ajuste global con ítems específicos.',
  );
}

export function validateLegends(
  legends: { code: string; value: string }[],
  mtoImpVentaEsperado: number,
) {
  if (!legends || legends.length === 0) {
    throw new BusinessLogicException(
      `La Nota es inválida: debe incluir al menos la leyenda de monto en letras (code=1000).`,
    );
  }

  const legendMonto = legends.find((l) => l.code === '1000');
  if (!legendMonto) {
    throw new BusinessLogicException(
      `La Nota es inválida: falta la leyenda obligatoria de monto en letras (code=1000).`,
    );
  }

  const montoEnLetrasEsperado = convertirMontoEnLetras(mtoImpVentaEsperado);

  if (
    legendMonto?.value?.trim().toUpperCase() !==
    montoEnLetrasEsperado?.trim().toUpperCase()
  ) {
    throw new BusinessLogicException(
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
        throw new BusinessLogicException(
          `El código de producto ${codProducto} no es válido para una Nota de Débito por Mora. Debe ser ${CodigoProductoNotaDebito.INTERES_POR_MORA}.`,
        );
      }
      break;

    case '02': // Aumento en el valor
      if (
        codProducto !== CodigoProductoNotaDebito.AJUSTE_GLOBAL_OPERACION &&
        !existeEnFactura
      ) {
        throw new BusinessLogicException(
          `El código de producto ${codProducto} no es válido para una Nota de Débito por Aumento. 
          Debe ser ${CodigoProductoNotaDebito.AJUSTE_GLOBAL_OPERACION} (ajuste global) o un producto existente en la factura original.`,
        );
      }
      break;

    case '03': // Penalidades
      if (codProducto !== CodigoProductoNotaDebito.PENALIDAD_CONTRATO) {
        throw new BusinessLogicException(
          `El código de producto ${codProducto} no es válido para una Nota de Débito por Penalidad. Debe ser ${CodigoProductoNotaDebito.PENALIDAD_CONTRATO}.`,
        );
      }
      break;

    default:
      throw new BusinessLogicException(
        `Tipo de Nota de Débito ${tipoNotaDebito} no soportado para validación de códigos.`,
      );
  }
}

/**
 * Valida que el comprobante original tenga un único tipo de afectación IGV
 * y retorna dicho tipo.
 *
 * @throws BusinessLogicException si existen múltiples tipos de afectación en la factura original
 */
// export function validarTipoAfectacionUnico(details: DetailDto[]): any {
//   const tiposAfeOriginales = [...new Set(details.map((d) => d.tipAfeIgv))];

//   if (tiposAfeOriginales.length > 1) {
//     throw new BusinessLogicException(
//       `El comprobante original contiene ítems con diferentes tipos de afectación IGV (${tiposAfeOriginales.join(
//         ', ',
//       )}). No es posible generar una Nota de Débito global.`,
//     );
//   }

//   return tiposAfeOriginales[0];
// }

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
    throw new BusinessLogicException(
      `El RUC/DNI del cliente en la ${tipo} (${numDocNd}) no coincide con el de la factura original (${numDocOriginal}).`,
    );
  }
}
export function generateLegends(mtoImpVenta: number) {
  return [
    {
      code: LegendCodeEnum.MONTO_EN_LETRAS,
      value: convertirMontoEnLetras(mtoImpVenta),
    },
  ];
}
export function generarTributosRC(boleta: IDocumento) {
  return TRIBUTOS_RESUMEN.filter((t) => (boleta as any)[t.key] > 0) // se filtra por el nombre del mto: gravado, exonerado e inafecto solo los montos > 0
    .map((t) => ({
      billingPayment: {
        amount: (boleta as any)[t.key],
        instructionID: t.instructionID,
      },
      taxSubtotal: {
        id: t.id,
        name: t.name,
        taxTypeCode: t.taxTypeCode,
        amount: t.conIgv ? boleta.igv : 0,
      },
    }));
}
export function getFechaHoraActualLima(): Date {
  return dayjs().tz('America/Lima').startOf('day').toDate();
}

export function getFechaHoraActualLimaFormat(format:string): string {
  return dayjs.tz(dayjs(), 'America/Lima').format(format);
}
// Para resumenId y nombre de archivo
export function getFechaHoyYYYYMMDD(): string {
  return dayjs().tz('America/Lima').format('YYYYMMDD');
}
export function formatDateForSunat(date: Date | null): string {
  return dayjs(date).format('YYYY-MM-DD'); // formato exacto que SUNAT requiere
}
export function mapSunatToEstado(codigo: string): EstadoEnvioSunat {
  return codigoRespuestaSunatMap[codigo] || EstadoEnvioSunat.ERROR;
}
export function formatDateToDDMMYYYY(date: Date | string): string {
  return dayjs(date).tz('America/Lima').format('DD/MM/YYYY');
}

export function mapEstadoRC(estado: string): string {
  // Normalizamos el nombre a mayúsculas para evitar problemas
  const key = estado.toUpperCase() as keyof typeof EstadoComprobanteEnumSunat;
  return (
    EstadoComprobanteEnumSunat[key] ?? EstadoComprobanteEnumSunat.PENDIENTE
  );
}
export function obtenerTiposAfectacion(catalogos: ResponseCatalogoTipoDTO[]): {
  tipoAfectacionGravada: number[];
  tipoAfectacionExoneradas: number[];
  tipoAfectacionInafectas: number[];
} {
  // tomar detalles del catálogo TIPO_AFECTACION
  const detalles = catalogos
    .filter((c) => c.codigoCatalogo === TipoCatalogoEnum.TIPO_AFECTACION)
    .flatMap((c) => c.catalogoDetalle);

  // helper interno para no repetir código
  const extraerCodigos = (tipo: string): number[] =>
    detalles
      .filter((d) => d.tipoAfectacion?.toUpperCase() === tipo)
      .map((d) => parseInt(d.codigo, 10));
  return {
    tipoAfectacionGravada: extraerCodigos('GRAVADA'),
    tipoAfectacionExoneradas: extraerCodigos('EXONERADA'),
    tipoAfectacionInafectas: extraerCodigos('INAFECTA'),
  };
}
export function obtenerCatalogoPorCodigo(
  catalogos: ResponseCatalogoTipoDTO[],
  codigo: TipoCatalogoEnum,
): ResponseCatalogoTipoDTO | undefined {
  return catalogos.find((c) => c.codigoCatalogo === codigo);
}
export function obtenerDescPlan(codigo: string): string {
  switch (codigo) {
    case Plan.Basico:
      return 'Plan Básico';
    case Plan.Estándar:
      return 'Plan Estándar';
    case Plan.Profesional:
      return 'Plan Profesional';
    case Plan.Empresarial:
      return 'Plan Empresarial';
    default:
      return 'Plan desconocido';
  }
}
export function generateTenantCredentials(subDominio: string) {
  const username = `user_${subDominio}`;
  const password = Math.random().toString(36).slice(-10);
  return { username, password };
}
