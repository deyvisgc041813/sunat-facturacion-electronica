import { Injectable } from '@nestjs/common';

import {
  ChargeIndicatorEnum,
  NotaCreditoMotivo,
} from 'src/util/catalogo.enum';
import { create } from 'xmlbuilder2';
import { XmlCommonBuilder } from './common/xml-common-builder';
import { CreateNotaDto } from 'src/domain/comprobante/dto/notasComprobante/CreateNotaDto';
import { ComprobantesHelper } from 'src/util/comprobante-helpers';
import { CANTIDAD_DEFAULT, MAP_TIPO_AFECTACION_TRIBUTO, MAP_TRIBUTOS, MTO_CERO_NUMBER, TAX_EXEPTION_REASONCODE_ICBPER, TIPO_AFECTACION_EXONERADAS, TIPO_AFECTACION_GRAVADAS, TIPO_AFECTACION_INAFECTAS, UNIDAD_MEDIDAD_DEFAULT } from 'src/util/constantes';
/**
 *  Tipos de Nota de Crédito SUNAT (ResponseCode)
 *
 * 01 → Anulación de la operación
 *      - NO requiere detalle de ítems (CreditNoteLine).
 *      - Se anula todo el comprobante original → montos en 0.00.
 *
 * 02 → Anulación por error en el RUC
 *      - Puede NO requerir detalle de ítems.
 *      - Corrige el dato del cliente, no los productos.
 *
 * 03 → Corrección por error en la descripción
 *      - Requiere detalle de ítems (CreditNoteLine).
 *      - Se corrige la descripción de productos/servicios.
 *
 * 04 → Descuento global
 *      - Puede requerir detalle o aplicarse a todo el comprobante.
 *      - Se ajusta el monto total.
 *
 * 05 → Descuento por ítem
 *      - Requiere detalle de ítems (CreditNoteLine).
 *      - Se descuenta solo en líneas específicas.
 *
 * 06 → Devolución total de ítems
 *      - Requiere detalle de ítems.
 *      - Todos los productos devueltos → montos totales ajustados.
 *
 * 07 → Devolución parcial de ítems
 *      - Requiere detalle de ítems.
 *      - Solo algunos productos devueltos.
 *
 * 08 → Bonificación
 *      - Requiere detalle de ítems.
 *      - Se otorgan ítems en bonificación (gratuitos).
 *
 * 09 → Disminución en el valor
 *      - Requiere detalle de ítems.
 *      - Ajuste de precios o valores de ciertos ítems.
 */

@Injectable()
export class XmlBuilderNotaCreditoService {
  buildXml(
    dto: CreateNotaDto,
    tipoAfectacionGravadas: number[],
    tipoAfectacionExoneradas: number[],
    tipoAfectacionInafectas: number[],
  ): string {
    const root = create({
      version: '1.0',
      encoding: 'utf-8',
      standalone: false,
    }).ele('CreditNote', {
      xmlns: 'urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2',
      'xmlns:cac':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      'xmlns:cbc':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
      'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
      'xmlns:ext':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
    });

    // ====== UBLExtensions (firma digital) ======
    XmlCommonBuilder.addUBLExtensions(root);
    // ====== Datos básicos ======
    XmlCommonBuilder.addDatosBasicos(
      root,
      dto.ublVersion,
      dto.customizationID,
      `${dto.serie}-${dto.correlativo}`,
    )
      .ele('cbc:IssueDate')
      .txt(dto.fechaEmision.split('T')[0])
      .up()
      .ele('cbc:IssueTime')
      .txt(dto.fechaEmision.split('T')[1]?.substring(0, 8) || '00:00:00')
      .up();
    // Leyendas (ej. monto en letras)

    dto.legends.forEach((l) => {
      root.ele('cbc:Note', { languageLocaleID: l.code }).dat(l.value);
    });
    // Moneda
    root.ele('cbc:DocumentCurrencyCode').txt(dto.tipoMoneda).up();

    this.addDiscrepancy(root, dto);
    // ====== Referencia al documento afectado ======
    this.addBillingReference(root, dto);
    // ====== Firma, emisor y cliente ======
    XmlCommonBuilder.appendSignature(root, dto);
    XmlCommonBuilder.addCompany(root, dto);
    XmlCommonBuilder.addCustomer(root, dto);
    this.addDescuentoGlobal(root, dto);

    // ====== Totales TaxTotal ======
    this.addTaxTotal(
      root,
      dto,
      tipoAfectacionGravadas,
      tipoAfectacionExoneradas,
      tipoAfectacionInafectas,
    );
    // ====== Totales LegalMonetaryTotal ======
    this.addLegalMonetaryTotal(root, dto);
    // ====== Detalles  ======
    if (!dto.details || dto.details.length === 0) {
      this.addItemDefault(
        root,
        dto,
        tipoAfectacionGravadas,
        tipoAfectacionExoneradas,
        tipoAfectacionInafectas,
      );
    } else {
      this.addItemDetalle(root, dto);
    }
    return root.end({ prettyPrint: true });
  }
  private addItemDefault(
    root: any,
    dto: CreateNotaDto,
    tipoAfectacionGravadas: number[],
    tipoAfectacionExoneradas: number[],
    tipoAfectacionInafectas: number[],
  ) {
    //   /**
    //     Caso 1:  Para los motivos 01 (Anulación de la operación) y 02 (Anulación por error en el RUC),
    //     el comprobante se invalida totalmente, por lo que los importes del único ítem que se envía
    //     deben ser establecidos en 0.00.
    /* Caso 2: Resumen normal → generamos por tipo de afectación
      //     Cuando la factura o boleta relacionada a la nc es mixta (incluye operaciones gravadas, exoneradas e inafectas),
      //     se debe generar un ítem por cada tipo de operación de manera independiente.
      //*/
    let tipos: any[] = [];
    if (dto?.motivo?.codigo === NotaCreditoMotivo.DESCUENTO_GLOBAL) {
      // Caso descuento global: un ítem por cada tipo afectación con monto > 0
      tipos = [
        {
          monto: dto.mtoOperGravadas || 0,
          igv: dto.mtoIGV || 0,
          percent: (dto.porcentajeIgv || 0) * 100,
          exemption: '10',
          unitCode: 'NIU',
          CreditedQuantity: '1.0000',
          map: MAP_TRIBUTOS.IGV,
          description: 'Descuento global aplicado',
        },
        {
          monto: dto.mtoOperExoneradas || 0,
          igv: 0,
          percent: 0,
          exemption: '20',
          unitCode: 'NIU',
          CreditedQuantity: '1.0000',
          map: MAP_TRIBUTOS.EXO,
          description: 'Descuento global aplicado',
        },
        {
          monto: dto.mtoOperInafectas || 0,
          igv: 0,
          percent: 0,
          exemption: '30',
          unitCode: 'NIU',
          CreditedQuantity: '1.0000',
          map: MAP_TRIBUTOS.INA,
          description: 'Descuento global aplicado',
        },
      ].filter((t) => t.monto > 0);
    } else {
      // Caso normal: detalle item a item según tipo de afectación
      tipos = Object.values(
        dto.details.reduce(
          (acc, dt) => {
            const code = dt.tipAfeIgv;
            if (!acc[code]) {
              let monto = 0,
                igv = 0;

              if (tipoAfectacionGravadas.includes(code)) {
                monto = dto.mtoOperGravadas || 0;
                igv = dto.mtoIGV || 0;
              } else if (tipoAfectacionExoneradas.includes(code)) {
                monto = dto.mtoOperExoneradas || 0;
              } else if (tipoAfectacionInafectas.includes(code)) {
                monto = dto.mtoOperInafectas || 0;
              }

              acc[code] = {
                monto,
                igv,
                percent: (dto.porcentajeIgv || 0) * 100,
                exemption: code,
                unitCode: dt.unidad ?? 'NIU',
                CreditedQuantity: dt.cantidad ?? '1.0000',
                map: ComprobantesHelper.getMapByCodeNotas(
                  code,
                  tipoAfectacionGravadas,
                  tipoAfectacionExoneradas,
                  tipoAfectacionInafectas,
                ),
                description: dt.descripcion ?? 'Item de comprobante',
              };
            }
            return acc;
          },
          {} as Record<string, any>,
        ),
      ).filter((t) => t.monto > 0);
    }
    // Renderizar las líneas
    tipos.forEach((t, idx) =>
      XmlCommonBuilder.buildCreditNoteLineDefault(root, dto, t, idx + 1),
    );
  }

  private addItemDetalle(root: any, dto: CreateNotaDto) {
    console.log(dto?.details)
    dto?.details?.forEach((d, i) => {
      const line = root.ele('cac:CreditNoteLine'); // cada ítem de la Nota de Crédito

      // ID de la línea (número secuencial)
      line
        .ele('cbc:ID')
        .txt(String(i + 1))
        .up();

      line
        .ele('cbc:CreditedQuantity', { unitCode: d.unidad })
        .txt(d.cantidad.toFixed(4))
        .up();

      // Importe de la línea (valor neto sin IGV)
      // Aquí va el valor de venta ya con descuento aplicado, sin IGV
      // Ejemplo: mtoValorVenta = 90.00
      line
        .ele('cbc:LineExtensionAmount', { currencyID: dto.tipoMoneda })
        .txt(d.mtoValorVenta.toFixed(2)) // ej: 90.00
        .up();

      // Precio de referencia (obligatorio: unitario con IGV)
      // Es el precio unitario bruto (sin descuento) con IGV incluido
      // Fórmula: mtoValorUnitario * (1 + IGV/100)
      const pricingRef = line.ele('cac:PricingReference');
      const altPrice = pricingRef.ele('cac:AlternativeConditionPrice');
      altPrice
        .ele('cbc:PriceAmount', { currencyID: dto.tipoMoneda })
        .txt((d.mtoValorUnitario * (1 + d.porcentajeIgv / 100)).toFixed(6)) // ej: 118.000000
        .up();
      let priceTypeCode = [21, 31, 37].includes(d.tipAfeIgv) ? "02" : "01"; // precio de referencia con IGV  
      altPrice.ele('cbc:PriceTypeCode').txt(priceTypeCode).up();
      let tributo: any;
      let taxExemptionReasonCode = '';
      let mtoValorVenta = 0;
      if (d.icbper > 0) {
        tributo = MAP_TRIBUTOS.ICBPER;
        taxExemptionReasonCode = '9996';
        mtoValorVenta = 0;
      } else {
        tributo = MAP_TIPO_AFECTACION_TRIBUTO[d.tipAfeIgv];
        taxExemptionReasonCode = String(d.tipAfeIgv);
        mtoValorVenta = d.mtoValorVenta;
      }
      // Impuestos de la línea
      const taxTotalLine = line.ele('cac:TaxTotal');
      taxTotalLine
        .ele('cbc:TaxAmount', { currencyID: dto.tipoMoneda })
        .txt(d.totalImpuestos.toFixed(2)) //onto total del IGV en esta línea (ej: 16.20)
        .up();
      if (d.icbper > 0) {
        // Agrega el tributo IGV requerido por SUNAT en operaciones exoneradas o inafectas
        // (SUNAT exige siempre un TaxSubtotal con IGV, incluso si la línea solo tiene ICBPER)
        const mapTributo = TIPO_AFECTACION_EXONERADAS.includes(d.tipAfeIgv)
          ? MAP_TRIBUTOS.EXO
          : MAP_TRIBUTOS.INA;
        XmlCommonBuilder.agregarDetalleSubtotalIcbper(
          taxTotalLine,
          0,
          0,
          0,
          String(d.tipAfeIgv),
          dto.tipoMoneda,
          mapTributo,
        );
      }
      const sub = taxTotalLine.ele('cac:TaxSubtotal');
      sub
        .ele('cbc:TaxableAmount', { currencyID: dto.tipoMoneda })
        .txt(mtoValorVenta.toFixed(2)) // Base imponible neta sobre la que se calcula el IGV (ej: 90.00)
        .up();
      sub
        .ele('cbc:TaxAmount', { currencyID: dto.tipoMoneda })
        .txt(d.totalImpuestos.toFixed(2)) // Monto total del IGV en esta línea (ej: 16.20)
        .up();
      if (d.icbper > 0) {
        sub
          .ele('cbc:BaseUnitMeasure', { unitCode: d.unidad })
          .txt(d.cantidad)
          .up();
      }

      const cat = sub.ele('cac:TaxCategory');
      cat.ele('cbc:Percent').txt(d.porcentajeIgv.toFixed(2)).up(); // % IGV aplicado (ej: 18.00)
      cat.ele('cbc:TaxExemptionReasonCode').txt(taxExemptionReasonCode).up(); // Código de afectación GRavada, Exonerados, Inafecto (ej: 10 = gravado)
      const scheme = cat.ele('cac:TaxScheme');
      scheme.ele('cbc:ID').txt(tributo.id).up(); // Código del tributo  GRavada, Exonerados, Inafecto (ej: 1000 = gravado)
      scheme.ele('cbc:Name').txt(tributo.name).up(); // Nombre del tributo GRavada, Exonerados, Inafecto (ej: IGV = gravado)
      scheme.ele('cbc:TaxTypeCode').txt(tributo.taxTypeCode).up(); // Tipo GRavada, Exonerados, Inafecto  (ej: VAT = gravado)
      // Descuento por ítem (AllowanceCharge)
      // Solo se incluye si hay descuento y el motivo es 05 (Descuento por ítem)
      if (d.mtoDescuento && d.mtoDescuento > 0) {
        const allowanceCharge = line.ele('cac:AllowanceCharge');
        allowanceCharge.ele('cbc:ChargeIndicator').txt('false').up(); // "false" = descuento
        allowanceCharge
          .ele('cbc:AllowanceChargeReasonCode')
          .txt(dto.motivo.codigo) // 05 = descuento por ítem
          .up();
        allowanceCharge
          .ele('cbc:Amount', { currencyID: dto.tipoMoneda })
          .txt(d.mtoDescuento.toFixed(2)) // Importe del descuento (ej: 10.00)
          .up();
        allowanceCharge
          .ele('cbc:BaseAmount', { currencyID: dto.tipoMoneda })
          .txt((d.mtoValorUnitario * d.cantidad).toFixed(2)) // Base sobre la que aplica el descuento (ej: 100.00)
          .up();
      }

      // Producto
      const item = line.ele('cac:Item');
      item.ele('cbc:Description').dat(d.descripcion).up();
      item
        .ele('cac:SellersItemIdentification')
        .ele('cbc:ID')
        .txt(d.codProducto)
        .up();

      // Precio unitario neto sin IGV
      // SUNAT espera aquí el valor unitario ya con descuento aplicado, sin IGV
      // Fórmula: mtoValorVenta / cantidad
      // Ejemplo: 90.00 / 1 = 90.000000
      const priceUnitNet = d.mtoValorVenta / d.cantidad;
      line
        .ele('cac:Price')
        .ele('cbc:PriceAmount', { currencyID: dto.tipoMoneda })
        .txt(priceUnitNet.toFixed(6))
        .up();
    });
  }

  private addLegalMonetaryTotal(root: any, dto: CreateNotaDto) {
    const isAnulado =
      dto?.motivo?.codigo === NotaCreditoMotivo.ANULACION_OPERACION ||
      dto?.motivo?.codigo === NotaCreditoMotivo.ANULACION_ERROR_RUC;

    const mtoOperacion = isAnulado
      ? 0
      : (dto.mtoOperGravadas ?? 0) +
        (dto.mtoOperExoneradas ?? 0) +
        (dto.mtoOperInafectas ?? 0);
    const mtoTotal = isAnulado ? 0 : (dto.mtoImpVenta ?? 0);
    root
      .ele('cac:LegalMonetaryTotal')
      .ele('cbc:LineExtensionAmount', { currencyID: dto.tipoMoneda })
      .txt(mtoOperacion.toFixed(2))
      .up()
      .ele('cbc:TaxInclusiveAmount', { currencyID: dto.tipoMoneda })
      .txt((mtoOperacion + (dto.mtoIGV ?? 0)).toFixed(2))
      .up()
      .ele('cbc:PayableAmount', { currencyID: dto.tipoMoneda })
      .txt(mtoTotal.toFixed(2))
      .up();
  }
  private addTaxTotal(
    root: any,
    dto: CreateNotaDto,
    tipoAfectacionGravadas: number[],
    tipoAfectacionExoneradas: number[],
    tipoAfectacionInafectas: number[],
  ) {
    let tipos: any[] = [];
    // Caso 1: Anulación de operación (codigo 01 y 02) (todo en cero)
    /**
     Caso 2: Resumen normal → generamos por tipo de afectación
     Cuando la factura o boleta relacionada a la nc es mixta (incluye operaciones gravadas, exoneradas e inafectas),
     se debe generar el numero de TaxTotal por cada tipo de operación de manera independiente.
     */

    if (
      dto?.motivo?.codigo === NotaCreditoMotivo.ANULACION_OPERACION ||
      dto?.motivo?.codigo === NotaCreditoMotivo.ANULACION_ERROR_RUC
    ) {
      const description =
        dto?.motivo?.codigo === NotaCreditoMotivo.ANULACION_ERROR_RUC
          ? 'Anulación por error en el RUC'
          : 'Anulación de la operación';
      tipos = [
        {
          monto: MTO_CERO_NUMBER,
          igv: MTO_CERO_NUMBER,
          percent: MTO_CERO_NUMBER,
          exemption: TIPO_AFECTACION_GRAVADAS[0],
          unitCode: UNIDAD_MEDIDAD_DEFAULT,
          CreditedQuantity: CANTIDAD_DEFAULT,
          map: MAP_TRIBUTOS.IGV,
          description,
        },
      ];
    } else if (dto?.motivo?.codigo === NotaCreditoMotivo.DESCUENTO_GLOBAL) {
      tipos = [
        {
          monto: dto.mtoOperGravadas,
          igv: dto.mtoIGV,
          percent: (dto.porcentajeIgv || 0) * 100,
          exemption: TIPO_AFECTACION_GRAVADAS[0], // Gravado
          map: MAP_TRIBUTOS.IGV,
        },
        {
          monto: dto.mtoOperExoneradas,
          igv: MTO_CERO_NUMBER,
          percent: MTO_CERO_NUMBER,
          exemption: TIPO_AFECTACION_EXONERADAS[0], // Exonerado
          map: MAP_TRIBUTOS.EXO,
        },
        {
          monto: dto.mtoOperInafectas,
          igv: MTO_CERO_NUMBER,
          percent: MTO_CERO_NUMBER,
          exemption: TIPO_AFECTACION_INAFECTAS[0], // Inafecto
          map: MAP_TRIBUTOS.INA,
        },
      ].filter((t) => t.monto > 0);
    } else if (dto?.motivo?.codigo === NotaCreditoMotivo.DEVOLUCION_TOTAL) {
      const totalGravadas = dto.details
        .filter(
          (d) =>
            tipoAfectacionGravadas.includes(d.tipAfeIgv) &&
            (!d.icbper || d.icbper === 0),
        )
        .reduce((sum, d) => sum + d.mtoValorVenta, 0);

      const totalExoneradas = dto.details
        .filter(
          (d) =>
            tipoAfectacionExoneradas.includes(d.tipAfeIgv) &&
            (!d.icbper || d.icbper === 0),
        )
        .reduce((sum, d) => sum + d.mtoValorVenta, 0);

      const totalInafectas = dto.details
        .filter(
          (d) =>
            tipoAfectacionInafectas.includes(d.tipAfeIgv) &&
            (!d.icbper || d.icbper === 0),
        )
        .reduce((sum, d) => sum + d.mtoValorVenta, 0);

      tipos = [
        {
          monto: totalGravadas,
          igv: dto.mtoIGV || 0,
          percent: (dto.porcentajeIgv || 0) * 100,
          exemption: TIPO_AFECTACION_GRAVADAS[0],
          map: MAP_TRIBUTOS.IGV,
        },
        {
          monto: totalExoneradas,
          igv: MTO_CERO_NUMBER,
          percent: MTO_CERO_NUMBER,
          exemption: TIPO_AFECTACION_EXONERADAS[0],
          map: MAP_TRIBUTOS.EXO,
        },
        {
          monto: totalInafectas,
          igv: MTO_CERO_NUMBER,
          percent: MTO_CERO_NUMBER,
          exemption: TIPO_AFECTACION_INAFECTAS[0],
          map: MAP_TRIBUTOS.INA,
        },
      ].filter((t) => t.monto > 0);

      const totalBolsa = dto.details
        .filter((d) => d.icbper && d.icbper > 0)
        .reduce((sum, d) => {
          if (tipoAfectacionGravadas.includes(d.tipAfeIgv)) {
            // Gravada → ICBPER + IGV de esa base
            console.log("dto.porcentajeIgv ", dto.porcentajeIgv)
            const igv = d.mtoValorVenta * dto.porcentajeIgv;
            return sum + d.icbper + igv;
          }
          // Otras afectaciones → solo ICBPER
          return sum + d.icbper;
        }, 0);

      if (totalBolsa > 0) {
        tipos.push({
          monto: 0,
          igv: totalBolsa,
          percent: 0,
          exemption: TAX_EXEPTION_REASONCODE_ICBPER,
          map: MAP_TRIBUTOS.ICBPER,
        });
      }
    } else {
      tipos = Object.values(
        dto.details.reduce(
          (acc, dt) => {
            const code = dt.tipAfeIgv;

            if (!acc[code]) {
              let monto = 0;
              let igv = 0;

              if (tipoAfectacionGravadas.includes(code)) {
                monto = dto.mtoOperGravadas || 0;
                igv = dto.mtoIGV || 0;
              } else if (tipoAfectacionExoneradas.includes(code)) {
                monto = dto.mtoOperExoneradas || 0;
              } else if (tipoAfectacionInafectas.includes(code)) {
                monto = dto.mtoOperInafectas || 0;
              }

              acc[code] = {
                monto,
                igv,
                percent: (dto.porcentajeIgv || 0) * 100,
                exemption: code,
                map: ComprobantesHelper.getMapByCodeNotas(
                  code,
                  tipoAfectacionGravadas,
                  tipoAfectacionExoneradas,
                  tipoAfectacionInafectas,
                ),
              };
            }

            return acc;
          },
          {} as Record<string, any>,
        ),
      ).filter((t) => t.monto > 0);
    }
    if (tipos.length > 0) {
      const taxTotal = root.ele('cac:TaxTotal');

      // Total global de impuestos (suma de subtotales)
      const totalImpuesto = tipos.reduce((acc, t) => acc + t.igv, 0);
      taxTotal
        .ele('cbc:TaxAmount', { currencyID: dto.tipoMoneda })
        .txt(totalImpuesto.toFixed(2))
        .up();

      // Subtotales por cada tipo de operación
      for (const t of tipos) {
        const sub = taxTotal.ele('cac:TaxSubtotal');
        sub
          .ele('cbc:TaxableAmount', { currencyID: dto.tipoMoneda })
          .txt(t.monto.toFixed(2))
          .up();
        sub
          .ele('cbc:TaxAmount', { currencyID: dto.tipoMoneda })
          .txt(t.igv.toFixed(2))
          .up();

        const cat = sub.ele('cac:TaxCategory');
        cat.ele('cbc:Percent').txt(t.percent.toFixed(2)).up();
        cat.ele('cbc:TaxExemptionReasonCode').txt(t.exemption).up();

        const scheme = cat.ele('cac:TaxScheme');
        scheme.ele('cbc:ID').txt(t.map.id).up();
        scheme.ele('cbc:Name').txt(t.map.name).up();
        scheme.ele('cbc:TaxTypeCode').txt(t.map.taxTypeCode).up();
      }
    }
  }

  private addDiscrepancy(root: any, dto: CreateNotaDto) {
    // ====== Motivo (DiscrepancyResponse) ======
    const discrepancy = root.ele('cac:DiscrepancyResponse');
    discrepancy
      .ele('cbc:ReferenceID')
      .txt(
        `${dto.documentoRelacionado.serie}-${dto.documentoRelacionado.correlativo}`,
      )
      .up();
    discrepancy.ele('cbc:ResponseCode').txt(dto.motivo.codigo).up();
    discrepancy.ele('cbc:Description').txt(dto.motivo.descripcion).up();
  }

  private addDescuentoGlobal(root: any, dto: CreateNotaDto) {
    if (!dto.descuentoGlobal || dto.descuentoGlobal.length === 0) {
      return; // nada que agregar
    }
    for (const d of dto.descuentosGlobales) {
      const allowanceCharge = root.ele('cac:AllowanceCharge');
      allowanceCharge
        .ele('cbc:ChargeIndicator')
        .txt(ChargeIndicatorEnum.DESCUENTO)
        .up(); // SUNAT: "false" = es un descuento, "true" = recargo
      allowanceCharge.ele('cbc:AllowanceChargeReasonCode').txt(d.codigo).up();
      allowanceCharge
        .ele('cbc:Amount', { currencyID: dto.tipoMoneda })
        .txt(d.monto.toFixed(2))
        .up();
      allowanceCharge
        .ele('cbc:BaseAmount', { currencyID: dto.tipoMoneda })
        .txt((d.montoBase).toFixed(2))
        .up();
    }
  }
  private addBillingReference(root: any, dto: CreateNotaDto) {
    const billingReference = root.ele('cac:BillingReference');
    const invoiceDocRef = billingReference.ele('cac:InvoiceDocumentReference');
    invoiceDocRef
      .ele('cbc:ID')
      .txt(
        `${dto.documentoRelacionado.serie}-${dto.documentoRelacionado.correlativo}`,
      )
      .up();
    invoiceDocRef
      .ele('cbc:DocumentTypeCode')
      .txt(dto.documentoRelacionado.tipoComprobante)
      .up();
  }
}
