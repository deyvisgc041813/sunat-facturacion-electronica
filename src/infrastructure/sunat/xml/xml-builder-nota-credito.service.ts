import { Injectable } from '@nestjs/common';

import {
  ChargeIndicatorEnum,
  MAP_TIPO_AFECTACION_TRIBUTO,
  MAP_TRIBUTOS,
  NotaCreditoMotivo,
} from 'src/util/catalogo.enum';
import { create } from 'xmlbuilder2';
import { XmlCommonBuilder } from './common/xml-common-builder';
import { CreateNCDto } from 'src/domain/comprobante/dto/notasComprobante/CreateNCDto';
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
  buildXml(dto: CreateNCDto): string {
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
      '2.0',
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
    this.addTaxTotal(root, dto);
    // ====== Totales LegalMonetaryTotal ======
    this.addLegalMonetaryTotal(root, dto);
    // ====== Detalles  ======
    if (!dto.details || dto.details.length === 0)
      this.addItemDefault(root, dto);
    else this.addItemDetalle(root, dto);
    return root.end({ prettyPrint: true });
  }
  private addItemDefault(root: any, dto: CreateNCDto) {
    // Si el motivo es "01 - Anulación de operación"
    if (dto.motivo?.codigo === NotaCreditoMotivo.ANULACION_OPERACION) {
      const line = root.ele('cac:CreditNoteLine');
      line.ele('cbc:ID').txt('1').up();
      line.ele('cbc:CreditedQuantity', { unitCode: 'NIU' }).txt('1.0000').up();

      // Todo en 0
      line
        .ele('cbc:LineExtensionAmount', { currencyID: dto.tipoMoneda })
        .txt('0.00')
        .up();

      const taxTotalLine = line.ele('cac:TaxTotal');
      taxTotalLine
        .ele('cbc:TaxAmount', { currencyID: dto.tipoMoneda })
        .txt('0.00')
        .up();

      const sub = taxTotalLine.ele('cac:TaxSubtotal');
      sub
        .ele('cbc:TaxableAmount', { currencyID: dto.tipoMoneda })
        .txt('0.00')
        .up();
      sub.ele('cbc:TaxAmount', { currencyID: dto.tipoMoneda }).txt('0.00').up();

      const cat = sub.ele('cac:TaxCategory');
      cat.ele('cbc:Percent').txt('0.00').up();
      cat.ele('cbc:TaxExemptionReasonCode').txt('10').up(); // default Gravado - onerosa

      const scheme = cat.ele('cac:TaxScheme');
      scheme.ele('cbc:ID').txt('1000').up();
      scheme.ele('cbc:Name').txt('IGV').up();
      scheme.ele('cbc:TaxTypeCode').txt('VAT').up();
      return; // Termina aquí
    }

    // Caso normal: construimos lista de tipos de operación con monto > 0
    const tipos = [
      {
        tipo: 'GRAVADA',
        monto: dto.mtoOperGravadas || 0,
        igv: dto.mtoIGV || 0,
        percent: (dto.porcentajeIgv || 0) * 100,
        exemption: '10',
        map: MAP_TRIBUTOS.IGV,
      },
      {
        tipo: 'EXONERADA',
        monto: dto.mtoOperExoneradas || 0,
        igv: 0,
        percent: 0,
        exemption: '20',
        map: MAP_TRIBUTOS.EXO,
      },
      {
        tipo: 'INAFECTA',
        monto: dto.mtoOperInafectas || 0,
        igv: 0,
        percent: 0,
        exemption: '30',
        map: MAP_TRIBUTOS.INA,
      },
    ].filter((t) => t.monto > 0);

    // Generamos una línea por cada tipo válido
    let lineId = 1;
    for (const t of tipos) {
      const line = root.ele('cac:CreditNoteLine');
      line.ele('cbc:ID').txt(lineId.toString()).up();
      line.ele('cbc:CreditedQuantity', { unitCode: 'NIU' }).txt('1.0000').up();

      // Base imponible
      line
        .ele('cbc:LineExtensionAmount', { currencyID: dto.tipoMoneda })
        .txt(t.monto.toFixed(2))
        .up();

      // TaxTotal
      const taxTotalLine = line.ele('cac:TaxTotal');
      taxTotalLine
        .ele('cbc:TaxAmount', { currencyID: dto.tipoMoneda })
        .txt(t.igv.toFixed(2))
        .up();

      const sub = taxTotalLine.ele('cac:TaxSubtotal');
      sub
        .ele('cbc:TaxableAmount', { currencyID: dto.tipoMoneda })
        .txt(t.monto.toFixed(2))
        .up();
      sub
        .ele('cbc:TaxAmount', { currencyID: dto.tipoMoneda })
        .txt(t.igv.toFixed(2))
        .up();

      // TaxCategory
      const cat = sub.ele('cac:TaxCategory');
      cat.ele('cbc:Percent').txt(t.percent.toFixed(2)).up();
      cat.ele('cbc:TaxExemptionReasonCode').txt(t.exemption).up();

      const scheme = cat.ele('cac:TaxScheme');
      scheme.ele('cbc:ID').txt(t.map.id).up();
      scheme.ele('cbc:Name').txt(t.map.name).up();
      scheme.ele('cbc:TaxTypeCode').txt(t.map.taxTypeCode).up();

      lineId++;
    }
  }

  private addItemDetalle(root: any, dto: CreateNCDto) {
    dto?.details?.forEach((d, i) => {
      const line = root.ele('cac:CreditNoteLine'); //
      line
        .ele('cbc:ID')
        .txt(String(i + 1))
        .up();
      line
        .ele('cbc:CreditedQuantity', { unitCode: d.unidad })
        .txt(d.cantidad.toFixed(4))
        .up();
      line
        .ele('cbc:LineExtensionAmount', { currencyID: dto.tipoMoneda })
        .txt(d.mtoValorVenta.toFixed(2))
        .up();
      // Precio de referencia (unitario con IGV)
      const pricingRef = line.ele('cac:PricingReference');
      const altPrice = pricingRef.ele('cac:AlternativeConditionPrice');
      altPrice
        .ele('cbc:PriceAmount', { currencyID: dto.tipoMoneda })
        .txt(d.mtoPrecioUnitario.toFixed(6))
        .up();
      altPrice.ele('cbc:PriceTypeCode').txt('01').up();

      // Impuestos
      const taxTotalLine = line.ele('cac:TaxTotal');
      taxTotalLine
        .ele('cbc:TaxAmount', { currencyID: dto.tipoMoneda })
        .txt(d.totalImpuestos.toFixed(2))
        .up();

      const sub = taxTotalLine.ele('cac:TaxSubtotal');
      sub
        .ele('cbc:TaxableAmount', { currencyID: dto.tipoMoneda })
        .txt(d.mtoValorVenta.toFixed(2))
        .up();
      sub
        .ele('cbc:TaxAmount', { currencyID: dto.tipoMoneda })
        .txt(d.totalImpuestos.toFixed(2))
        .up();

      const cat = sub.ele('cac:TaxCategory');
      cat.ele('cbc:Percent').txt(d.porcentajeIgv.toFixed(2)).up();
      cat.ele('cbc:TaxExemptionReasonCode').txt(String(d.tipAfeIgv)).up();

      const tributo = MAP_TIPO_AFECTACION_TRIBUTO[d.tipAfeIgv];
      const scheme = cat.ele('cac:TaxScheme');
      scheme.ele('cbc:ID').txt(tributo.id).up();
      scheme.ele('cbc:Name').txt(tributo.name).up();
      scheme.ele('cbc:TaxTypeCode').txt(tributo.taxTypeCode).up();

      // Producto
      const item = line.ele('cac:Item');
      item.ele('cbc:Description').dat(d.descripcion).up();
      item
        .ele('cac:SellersItemIdentification')
        .ele('cbc:ID')
        .txt(d.codProducto)
        .up();

      // Precio sin IGV
      line
        .ele('cac:Price')
        .ele('cbc:PriceAmount', { currencyID: dto.tipoMoneda })
        .txt(d.mtoValorUnitario.toFixed(6))
        .up();
    });
  }
  private addLegalMonetaryTotal(root: any, dto: CreateNCDto) {
    const mtoOperacion =
      (dto.mtoOperGravadas ?? 0) +
      (dto.mtoOperExoneradas ?? 0) +
      (dto.mtoOperInafectas ?? 0);
    root
      .ele('cac:LegalMonetaryTotal')
      .ele('cbc:LineExtensionAmount', { currencyID: dto.tipoMoneda })
      .txt(mtoOperacion.toFixed(2))
      .up()
      .ele('cbc:TaxInclusiveAmount', { currencyID: dto.tipoMoneda })
      .txt((mtoOperacion + (dto.mtoIGV ?? 0)).toFixed(2))
      .up()
      .ele('cbc:PayableAmount', { currencyID: dto.tipoMoneda })
      .txt((dto.mtoImpVenta ?? 0).toFixed(2))
      .up();
  }
  private addTaxTotal(root: any, dto: CreateNCDto) {
    // Caso 1: Anulación de operación (todo en cero)
    if (dto?.motivo?.codigo === NotaCreditoMotivo.ANULACION_OPERACION) {
      const taxTotal = root.ele('cac:TaxTotal');
      taxTotal
        .ele('cbc:TaxAmount', { currencyID: dto.tipoMoneda })
        .txt('0.00')
        .up();

      const sub = taxTotal.ele('cac:TaxSubtotal');
      sub
        .ele('cbc:TaxableAmount', { currencyID: dto.tipoMoneda })
        .txt('0.00')
        .up();
      sub.ele('cbc:TaxAmount', { currencyID: dto.tipoMoneda }).txt('0.00').up();

      const cat = sub.ele('cac:TaxCategory');
      cat.ele('cbc:Percent').txt('0.00').up();
      cat.ele('cbc:TaxExemptionReasonCode').txt('10').up();

      const scheme = cat.ele('cac:TaxScheme');
      scheme.ele('cbc:ID').txt(MAP_TRIBUTOS.IGV.id).up();
      scheme.ele('cbc:Name').txt(MAP_TRIBUTOS.IGV.name).up();
      scheme.ele('cbc:TaxTypeCode').txt(MAP_TRIBUTOS.IGV.taxTypeCode).up();
      return;
    }

    // Caso 2: Resumen normal → generamos por tipo de afectación
    const tipos = [
      {
        monto: dto.mtoOperGravadas || 0,
        igv: dto.mtoIGV || 0,
        percent: (dto.porcentajeIgv || 0) * 100,
        exemption: '10', // Gravado
        map: MAP_TRIBUTOS.IGV,
      },
      {
        monto: dto.mtoOperExoneradas || 0,
        igv: 0,
        percent: 0,
        exemption: '20', // Exonerado
        map: MAP_TRIBUTOS.EXO,
      },
      {
        monto: dto.mtoOperInafectas || 0,
        igv: 0,
        percent: 0,
        exemption: '30', // Inafecto
        map: MAP_TRIBUTOS.INA,
      },
    ].filter((t) => t.monto > 0);

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

  private addDiscrepancy(root: any, dto: CreateNCDto) {
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

  private addDescuentoGlobal(root: any, dto: CreateNCDto) {
    if (!dto.descuentosGlobales || dto.descuentosGlobales.length === 0) {
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
        .txt(d.montoBase.toFixed(2))
        .up();
    }
  }
  private addBillingReference(root: any, dto: CreateNCDto) {
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
