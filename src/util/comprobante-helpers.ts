import { BadRequestException } from '@nestjs/common';
import { CreateInvoiceDto } from 'src/domain/comprobante/dto/invoice/CreateInvoiceDto';
import { generateLegends } from './Helpers';
import {
  MAP_TRIBUTOS,
  TIPO_AFECTACION_EXONERADAS,
  TIPO_AFECTACION_GRAVADAS,
  TIPO_AFECTACION_INAFECTAS,
  TipoCatalogoEnum,
} from './catalogo.enum';
import { DetailDto } from 'src/domain/comprobante/dto/base/DetailDto';
import { ResponseCatalogoTipoDTO } from 'src/domain/catalogo/dto/catalogo.response';
import { TributoTasaResponseDto } from 'src/domain/tributo-tasa/dto/TributoTasaResponseDto';
interface ValidationError {
  index: number; // índice del detalle
  field: string; // campo validado
  message: string; // descripción del error
}
export class ComprobantesHelper {
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
  static validarDetalleInvoice(
    details: DetailDto[],
    catalogos: ResponseCatalogoTipoDTO[],
    tasasVigentes: TributoTasaResponseDto[],
  ): ValidationError[] {
    const errores: ValidationError[] = [];
    // buscamos el catálogo de unidades de medida (catalogo_tipo_id = 3)

    const catalogoUnidades = catalogos.filter(
      (c) => c.codigoCatalogo === TipoCatalogoEnum.UNIDAD_MEDIDA,
    );
    const catalogoTipoAfectacion = catalogos.filter(
      (c) => c.codigoCatalogo === TipoCatalogoEnum.TIPO_AFECTACION,
    );
    // Convertirlos en una lista plana de códigos permitidos
    const codigosUnidades = catalogoUnidades.flatMap((c) =>
      c.catalogoDetalle.map((d) => d.codigo),
    );
    const afectacionGravada = catalogoTipoAfectacion
      .flatMap((c) => c.catalogoDetalle) // sacar todos los detalles
      .filter((d) => d.tipoAfectacion?.toUpperCase() === 'GRAVADA') // quedarnos solo con GRAVADA
      .map((d) => parseInt(d.codigo)); // sacar solo los códigos
    const afectacionExoneradas = catalogoTipoAfectacion
      .flatMap((c) => c.catalogoDetalle) // sacar todos los detalles
      .filter((d) => d.tipoAfectacion?.toUpperCase() === 'EXONERADA') // quedarnos solo con EXONERADA
      .map((d) => parseInt(d.codigo)); // sacar solo los códigos
    const afectacionInafectas = catalogoTipoAfectacion
      .flatMap((c) => c.catalogoDetalle) // sacar todos los detalles
      .filter((d) => d.tipoAfectacion?.toUpperCase() === 'INAFECTA') // quedarnos solo con INAFECTA
      .map((d) => parseInt(d.codigo)); // sacar solo los códigos
    const tasaIgv = tasasVigentes.find(
      (ta) => ta.codigoSunat === MAP_TRIBUTOS.IGV.id,
    );
    details.forEach((item, index) => {
      const row = index + 1;
      // 1. Validar unidad de medida
      if (!codigosUnidades.includes(item.unidad)) {
        errores.push({
          index: row,
          field: 'Unidad',
          message: `La unidad '${item.unidad}' no existe en el catálogo.`,
        });
      }

      // 2. Validar cantidad > 0
      if (item.cantidad <= 0) {
        errores.push({
          index: row,
          field: 'Cantidad',
          message: 'La cantidad debe ser mayor a 0.',
        });
      }

      // 3. Validar afectación IGV
      //    tipAfeIgv -> 10 (gravada), 20 (exonerada), 30 (inafecta), etc.
      if (afectacionGravada.includes(item.tipAfeIgv)) {
        // Gravada
        if (item.porcentajeIgv <= 0) {
          errores.push({
            index: row,
            field: 'porcentajeIgv',
            message: `La afectación '${item.tipAfeIgv}' es gravada, el porcentaje IGV debe ser > 0.`,
          });
        }
        // validar impusto igv
        if (Number(item.porcentajeIgv) !== Number(tasaIgv?.tasa)) {
          errores.push({
            index: row,
            field: 'porcentajeIgv',
            message: `El porcentaje IGV (${item.porcentajeIgv}) no coincide con el catálogo (${tasaIgv?.tasa}).`,
          });
        }
      } else if (
        afectacionExoneradas.includes(item.tipAfeIgv) ||
        afectacionInafectas.includes(item.tipAfeIgv)
      ) {
        // Exonerada / Inafecta
        if (item.porcentajeIgv !== 0) {
          errores.push({
            index: row,
            field: 'porcentajeIgv',
            message: `La afectación '${item.tipAfeIgv}' no debe tener IGV, el porcentaje debe ser 0.`,
          });
        }
      }
      // 4. Validar coherencia entre valor unitario y precio con IGV
      const esperado = +(
        item.mtoPrecioUnitario > 0
          ? item.mtoPrecioUnitario / (1 + item.porcentajeIgv / 100) // si viene precio, se puede verificar
          : item.mtoValorUnitario
      ) // si viene 0, confiar en valor unitario
        .toFixed(2);

      if (
        item.mtoPrecioUnitario > 0 &&
        Math.abs(item.mtoValorUnitario - esperado) > 0.01
      ) {
        errores.push({
          index: row,
          field: 'mtoValorUnitario',
          message: `El valor unitario (${item.mtoValorUnitario}) no coincide con el precio unitario (${item.mtoPrecioUnitario}) sin IGV (${esperado}).`,
        });
      }
      // 6. Validar bolsas plásticas (ICBP)
      if (item.icbper) {
        const tasaIcbperActual = tasasVigentes.find(
          (ta) => ta.codigoSunat === MAP_TRIBUTOS.ICBPER.id,
        );
        if (Number(item.icbper) !== Number(tasaIcbperActual?.tasa)) {
          errores.push({
            index: row,
            field: 'icbper',
            message: `La tasa ICBPER enviada (${item.icbper}) no coincide con la vigente (${tasaIcbperActual?.tasa}).`,
          });
        }
        if (!item.cantidad || item.cantidad <= 0) {
          errores.push({
            index: row,
            field: 'cantidad',
            message: 'La cantidad de bolsas plásticas debe ser mayor a 0.',
          });
        }
      }
    });

    return errores;
  }
  static getMapByCodeNotas(
    code: number,
    tipoAfectacionGravadas: number[],
    tipoAfectacionExoneradas: number[],
    tipoAfectacionInafectas: number[],
  ) {
    if (tipoAfectacionGravadas.includes(code)) return MAP_TRIBUTOS.IGV;
    if (tipoAfectacionExoneradas.includes(code)) return MAP_TRIBUTOS.EXO;
    if (tipoAfectacionInafectas.includes(code)) return MAP_TRIBUTOS.INA;
    if (code === 40) return MAP_TRIBUTOS.EXP; // tributo de exportacion
    return MAP_TRIBUTOS.IGV;
  }
}
