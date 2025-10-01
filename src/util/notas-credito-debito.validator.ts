import { NotaCreditoMotivo } from 'src/util/catalogo.enum';
import { BadRequestException } from '@nestjs/common';
import { TipoComprobanteEnum } from './catalogo.enum';
import { DetailDto } from 'src/domain/comprobante/dto/base/DetailDto';

export function validarComprobante(comprobante: any): void {
  switch (comprobante.tipoComprobante) {
    case TipoComprobanteEnum.FACTURA:
    case TipoComprobanteEnum.BOLETA:
      validarFacturaBoleta(comprobante);
      break;

    case TipoComprobanteEnum.NOTA_CREDITO:
      validarNotaCredito(comprobante);
      break;

    case TipoComprobanteEnum.NOTA_DEBITO:
      validarNotaDebito(comprobante);
      break;

    default:
      throw new BadRequestException(
        `Tipo de comprobante no soportado: ${comprobante.tipoComprobante}`,
      );
  }
}

export function validarProductoYTipoAfectacion(
  detalle: DetailDto,
  existComprobante: any,
) {
  // Validar existencia
  if (!existComprobante) {
    throw new BadRequestException(
      `El producto con código ${detalle.codProducto} no existe en el comprobante original. 
       Debe enviar el mismo código del ítem al que se aplicará la operación.`,
    );
  }

  // Validar tipo de afectación IGV
  if (existComprobante.tipAfeIgv !== detalle.tipAfeIgv) {
    throw new BadRequestException(
      `El ítem ${detalle.codProducto} tiene un tipo de afectación IGV distinto al comprobante original. 
       Enviado: ${detalle.tipAfeIgv}, Original: ${existComprobante.tipAfeIgv}`,
    );
  }
  return true;
}



// detailsOriginal = ítems del comprobante original
// tipAfeNotaDebito = tipo de afectación enviado en el detail de la ND
export function validarTipoAfectacionNotaDebito(
  detailsOriginal: DetailDto[],
  tipAfeNotaDebito: number,
): number {
  const tiposAfeOriginales = [...new Set(detailsOriginal.map((d) => d.tipAfeIgv))];

  if (tiposAfeOriginales.length === 0) {
    throw new BadRequestException(
      'El comprobante original no contiene ítems con tipo de afectación válido.',
    );
  }

  if (!tiposAfeOriginales.includes(tipAfeNotaDebito)) {
    throw new BadRequestException(
      `El tipo de afectación enviado en la Nota de Débito (${tipAfeNotaDebito}) ` +
      `no corresponde a ninguno de los tipos del comprobante original (${tiposAfeOriginales.join(', ')}).`,
    );
  }

  return tipAfeNotaDebito; // válido
}

export function validarItemsNotaCredito(
  details: DetailDto[],
  detComOriginal: DetailDto[],
  motivoCodigo: string
): string[] {
  const errores: string[] = [];

  for (const d of details) {
    const existComprobante = detComOriginal?.find(
      (f) => f.codProducto === d.codProducto,
    );

    if (!existComprobante) {
      errores.push(
        `El ítem ${d.codProducto} no existe en el comprobante original. Debe enviar el mismo código del ítem.`
      );
      continue;
    }

    // ---- Validaciones comunes ----
    if (existComprobante.tipAfeIgv !== d.tipAfeIgv) {
      errores.push(
        `El ítem ${d.codProducto} tiene tipo de afectación IGV ${d.tipAfeIgv}, pero en el comprobante original es ${existComprobante.tipAfeIgv}.`
      );
    }

    if (existComprobante.unidad !== d.unidad) {
      errores.push(
        `El ítem ${d.codProducto} tiene unidad ${d.unidad}, pero en el comprobante original es ${existComprobante.unidad}.`
      );
    }

    if (
      Number(d.mtoValorUnitario).toFixed(2) !==
      Number(existComprobante.mtoValorUnitario).toFixed(2)
    ) {
      errores.push(
        `El ítem ${d.codProducto} tiene valor unitario ${d.mtoValorUnitario}, pero en el comprobante original es ${existComprobante.mtoValorUnitario}.`
      );
    }

    const totalLineaOriginal =
      Number(existComprobante.mtoValorUnitario) *
      Number(existComprobante.cantidad);

    // ---- Lógica específica por motivo ----
    if (NotaCreditoMotivo.DESCUENTO_POR_ITEM === motivoCodigo) {
      // Descuento por ítem
      if (Number(d.cantidad) !== Number(existComprobante.cantidad)) {
        errores.push(
          `El ítem ${d.codProducto} tiene cantidad ${d.cantidad}, pero en el comprobante original es ${existComprobante.cantidad}.`
        );
      }

      if (Number(d.mtoDescuento) <= 0) {
        errores.push(
          `El descuento del ítem ${d.codProducto} (${d.mtoDescuento}) debe ser mayor que 0.`
        );
      }

      if (Number(d.mtoDescuento) === totalLineaOriginal) {
        errores.push(
          `El ítem ${d.codProducto} tiene un descuento igual al valor original. Debe emitirse una Nota de Crédito de devolución/anulación (motivo 01 o 02).`
        );
      }

      if (Number(d.mtoDescuento) > totalLineaOriginal) {
        errores.push(
          `El descuento del ítem ${d.codProducto} (${d.mtoDescuento}) no puede ser mayor al valor original de la línea (${totalLineaOriginal}).`
        );
      }
    }

    if (NotaCreditoMotivo.DEVOLUCION_POR_ITEM ===  motivoCodigo) {
      // Devolución por ítem
      if (Number(d.cantidad) <= 0) {
        errores.push(
          `La cantidad devuelta del ítem ${d.codProducto} (${d.cantidad}) debe ser mayor que 0.`
        );
      }

      if (Number(d.cantidad) > Number(existComprobante.cantidad)) {
        errores.push(
          `La cantidad devuelta del ítem ${d.codProducto} (${d.cantidad}) no puede ser mayor a la cantidad original (${existComprobante.cantidad}).`
        );
      }
      // Nota: cantidadDevuelta == cantidadOriginal => devolución total válida
    }
  }

  return errores;
}

function validarNotaCredito(comprobante: any): void {
  // 1. Validar tipo de comprobante
  if (comprobante.tipoComprobante !== TipoComprobanteEnum.NOTA_CREDITO) {
    throw new BadRequestException(
      'El tipo de comprobante debe ser 07 (Nota de Crédito).',
    );
  }

  if (
    ![TipoComprobanteEnum.FACTURA, TipoComprobanteEnum.BOLETA].includes(
      comprobante.documentoRelacionado.tipoComprobante,
    )
  ) {
    throw new BadRequestException(
      'El documento relacionado debe ser Factura (01) o Boleta (03).',
    );
  }
  const fechaEmision = new Date(comprobante.fechaEmision);
  const hoy = new Date();
  if (fechaEmision > hoy) {
    throw new BadRequestException('La fecha de emisión no puede ser futura.');
  }
  switch (comprobante.motivo.codigo) {
    case NotaCreditoMotivo.ANULACION_OPERACION: 
      if (
        comprobante.mtoOperGravadas !== 0 ||
        comprobante.mtoOperExoneradas !== 0 ||
        comprobante.mtoOperInafectas !== 0 ||
        comprobante.mtoIGV !== 0 ||
        comprobante.subTotal !== 0 ||
        comprobante.mtoImpVenta !== 0
      ) {
        throw new BadRequestException(
          'En una Nota de Crédito con motivo 01 (Anulación de la operación), los montos gravados, exonerados, inafectos, IGV y total deben ser igual a 0.',
        );
      }
      if (comprobante.details?.length > 0) {
        throw new BadRequestException('En motivo 01, no debe haber detalles.');
      }
      break;

    case NotaCreditoMotivo.DESCUENTO_GLOBAL: 
      // 1. Validar que exista al menos un descuento global
      if (
        !comprobante.descuentoGlobal ||
        comprobante.descuentoGlobal.length === 0
      ) {
        throw new BadRequestException(
          'Debe registrar al menos un descuento global en la nota de crédito con motivo 04.',
        );
      }
      // 2. Validar motivo
      if (comprobante.motivo?.codigo !== NotaCreditoMotivo.DESCUENTO_GLOBAL) {
        throw new BadRequestException(
          'El motivo debe ser 04 (Descuento global).',
        );
      }
      break;

    case NotaCreditoMotivo.ANULACION_ERROR_RUC:
      // 2. Validar motivo
      if (
        comprobante.motivo?.codigo !== NotaCreditoMotivo.ANULACION_ERROR_RUC
      ) {
        throw new BadRequestException(
          'El motivo debe ser 02 (Anulación por error en el RUC).',
        );
      }
      if (
        comprobante.mtoOperGravadas !== 0 ||
        comprobante.mtoOperExoneradas !== 0 ||
        comprobante.mtoOperInafectas !== 0 ||
        comprobante.mtoIGV !== 0 ||
        comprobante.subTotal !== 0 ||
        comprobante.mtoImpVenta !== 0
      ) {
        throw new BadRequestException(
          'En una Nota de Crédito con motivo 02 (Anulación por error en el RUC), los montos gravados, exonerados, inafectos, IGV y total deben ser igual a 0.',
        );
      }
      if (comprobante.details?.length > 0) {
        throw new BadRequestException(
          'En una Nota de Crédito con motivo 02 (Anulación por error en el RUC), no debe haber detalles.',
        );
      }
      break;
    case NotaCreditoMotivo.DESCUENTO_POR_ITEM:
      if (!comprobante.details || comprobante.details.length === 0) {
        throw new BadRequestException(
          "En motivo 05 (descuento por ítem) debe haber ítems en 'details'.",
        );
      }
      break;
    case NotaCreditoMotivo.DEVOLUCION_POR_ITEM:
      if (!comprobante.details || comprobante.details.length === 0) {
        throw new BadRequestException(
          "En motivo 6 (devolución por ítem) debe haber ítems en 'details'.",
        );
      }
      break;
  }
}

function validarNotaDebito(comprobante: any): void {
  if (!comprobante.motivo?.codigo) {
    throw new BadRequestException('La Nota de Débito debe tener un motivo.');
  }

  // aquí puedes agregar validaciones por motivo específico
  if (!comprobante.details || comprobante.details.length === 0) {
    throw new BadRequestException(
      "La Nota de Débito debe tener ítems en 'details'.",
    );
  }

  if (comprobante.mtoImpVenta <= 0) {
    throw new BadRequestException(
      'La Nota de Débito debe tener un importe válido.',
    );
  }
}

function validarFacturaBoleta(comprobante: any): void {
  if (!comprobante.details || comprobante.details.length === 0) {
    throw new BadRequestException(
      "La factura/boleta debe tener al menos un ítem en 'details'.",
    );
  }

  if (!comprobante.client?.numDoc || !comprobante.client?.tipoDoc) {
    throw new BadRequestException(
      'El cliente debe tener tipo y número de documento.',
    );
  }

  if (!comprobante.company?.ruc) {
    throw new BadRequestException(
      'La sucursal emisora debe tener un RUC válido.',
    );
  }

  if (comprobante.mtoImpVenta <= 0) {
    throw new BadRequestException('El importe total debe ser mayor a 0.');
  }
}