import { BadRequestException } from '@nestjs/common';
import { CreateInvoiceDto } from 'src/domain/comprobante/dto/invoice/CreateInvoiceDto';
import { generateLegends } from './Helpers';
import {
  TIPO_AFECTACION_EXONERADAS,
  TIPO_AFECTACION_GRAVADAS,
  TIPO_AFECTACION_INAFECTAS,
} from './catalogo.enum';

export class NotaDebitoHelper {
  static recalcularMontos(data: CreateInvoiceDto): CreateInvoiceDto {
    let totalGravadas = 0;
    let totalExoneradas = 0;
    let totalInafectas = 0;
    let totalIGV = 0;
    let subTotal = 0;
    let totalICBPER = 0; // nuevo acumulador

    // procesar cada ítem
    data.details = data.details.map((item) => {
      const valorVenta = item.cantidad * item.mtoValorUnitario; // sin redondeo aún
      const baseIgv = valorVenta;

      const igv = TIPO_AFECTACION_GRAVADAS.includes(item.tipAfeIgv)
        ? valorVenta * (item.porcentajeIgv / 100) // full precision
        : 0;
      // calcular icbper si viene definido en el ítem
      const icbper = item.icbper ? item.icbper * item.cantidad : 0;
      const precioUnitario = item.mtoValorUnitario + igv / item.cantidad;
      const totalImpuestos = igv + icbper; // incluir ICBPER
      return {
        ...item,
        mtoValorVenta: this.round(valorVenta, 2),
        mtoBaseIgv: this.round(baseIgv, 2),
        igv: this.round(igv, 2),
        icbper: this.round(icbper, 2), //
        totalImpuestos: this.round(totalImpuestos, 2),
        mtoPrecioUnitario: this.round(precioUnitario, 2),
      };
    });

    // acumular totales con los valores originales (sin redondeo)
    data.details.forEach((item) => {
      const valorVentaRaw = item.cantidad * item.mtoValorUnitario;
      const igvRaw = TIPO_AFECTACION_GRAVADAS.includes(item.tipAfeIgv)
        ? valorVentaRaw * (item.porcentajeIgv / 100)
        : 0;

      subTotal += valorVentaRaw;
      totalIGV += igvRaw;
      totalICBPER += item.icbper; // acumular ICBPER
      if (TIPO_AFECTACION_GRAVADAS.includes(item.tipAfeIgv)) {
        totalGravadas += valorVentaRaw;
      }
      if (TIPO_AFECTACION_EXONERADAS.includes(item.tipAfeIgv)) {
        totalExoneradas += valorVentaRaw;
      }
      if (TIPO_AFECTACION_INAFECTAS.includes(item.tipAfeIgv)) {
        totalInafectas += valorVentaRaw;
      }
    });
    // totales de cabecera (ya redondeados a 2)
    data.mtoOperGravadas = this.round(totalGravadas, 2);
    data.mtoOperExoneradas = this.round(totalExoneradas, 2);
    data.mtoOperInafectas = this.round(totalInafectas, 2);
    data.mtoIGV = this.round(totalIGV, 2);
    data.subTotal = this.round(subTotal, 2);
    data.icbper = this.round(totalICBPER, 2); // incluir ICBPER
    // importe bruto y final

    const mtoImpVentaBruto = subTotal + totalIGV + totalICBPER; // aquí puede tener 4 decimales

    data.mtoImpVenta = this.round(mtoImpVentaBruto, 2);
    // leyenda en letras (ejemplo)
    data.legends = generateLegends(data.mtoImpVenta);
    return data;
  }
  // validaciones de entrada
  static validarDetallesCliente(data: CreateInvoiceDto) {
    if (!data.details || data.details.length === 0) {
      throw new BadRequestException(
        'El comprobante debe tener al menos un ítem.',
      );
    }
    data.details.forEach((d, i) => {
      if (d.cantidad <= 0) {
        throw new BadRequestException(
          `El ítem ${i + 1} tiene cantidad inválida.`,
        );
      }
      if (d.mtoValorUnitario < 0) {
        throw new BadRequestException(
          `El ítem ${i + 1} tiene precio inválido.`,
        );
      }
    });
  }
  private static round(num: number, places: number = 2): number {
    const factor = 10 ** places;
    return Math.round((num + Number.EPSILON) * factor) / factor;
  }
}
