import { Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from 'src/domain/comprobante/dto/invoice/CreateInvoiceDto';
import {
  MAP_TIPO_AFECTACION_TRIBUTO,
  MAP_TRIBUTOS,
  TIPO_AFECTACION_EXONERADAS,
  TIPO_AFECTACION_GRATUITAS,
  TIPO_AFECTACION_GRAVADAS,
} from 'src/util/catalogo.enum';
import { create } from 'xmlbuilder2';
import { XmlCommonBuilder } from './common/xml-common-builder';

@Injectable()
export class XmlBuilderInvoiceService {
  buildXml(dto: CreateInvoiceDto): string {
    const root = create({
      version: '1.0',
      encoding: 'utf-8',
      standalone: false,
    }).ele('Invoice', {
      xmlns: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
      'xmlns:cac':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      'xmlns:cbc':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
      'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
      'xmlns:ext':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
    });

    // Bloque UBLExtensions (necesario para la firma digital SUNAT)
    XmlCommonBuilder.addUBLExtensions(root);
    // Datos básicos
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
      //  Esto elimina el offset "-05:00" y deja solo HH:mm:ss
      .txt(dto.fechaEmision.split('T')[1]?.substring(0, 8) || '00:00:00')
      .up()
      .ele('cbc:DueDate')
      .txt(dto.fechaEmision.split('T')[0])
      .up()

      .ele('cbc:InvoiceTypeCode', { listID: dto.tipoOperacion })
      .txt(dto.tipoComprobante)
      .up();
    dto.legends.forEach((l) => {
      root.ele('cbc:Note', { languageLocaleID: l.code }).dat(l.value);
    });
    root.ele('cbc:DocumentCurrencyCode').txt(dto.tipoMoneda).up();
    // 3. Firma (cac:Signature) inmediatamente después de DocumentCurrencyCode
    XmlCommonBuilder.appendSignature(root, dto);
    // emisor
    XmlCommonBuilder.addCompany(root, dto);
    // cliente
    XmlCommonBuilder.addCustomer(root, dto);
    // Medio de pago
    root
      .ele('cac:PaymentTerms')
      .ele('cbc:ID')
      .txt('FormaPago')
      .up()
      .ele('cbc:PaymentMeansID')
      .txt(dto.formaPago.tipo)
      .up();
    // Agrupar montos por tributo (según tipAfeIgv de los items)
    const totalesPorTributo: Record<
      string,
      {
        taxable: number;
        tax: number;
        info: { id: string; name: string; taxTypeCode: string };
      }
    > = {};
    this.agruparTotalesPorTipoAfetiGV(dto, totalesPorTributo);
    // Totales impuestos
    this.addTotalesImpuestos(
      root,
      totalesPorTributo,
      dto.tipoMoneda
    );
    // Totales monetarios
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
      .txt((dto.mtoImpVenta ?? 0).toFixed(2))
      .up()
      .ele('cbc:PayableAmount', { currencyID: dto.tipoMoneda })
      .txt((dto.mtoImpVenta ?? 0).toFixed(2));

    // Detalle de líneas
    dto.details.forEach((d, i) => {
      const line = root.ele('cac:InvoiceLine');
      line.ele('cbc:ID').txt(String(i + 1));
      line
        .ele('cbc:InvoicedQuantity', { unitCode: d.unidad })
        .txt(d.cantidad.toFixed(4));
      line
        .ele('cbc:LineExtensionAmount', { currencyID: dto.tipoMoneda })
        .txt(d.mtoValorVenta.toFixed(2));
      // Precio de referencia (SUNAT exige precio unitario con IGV)
      const pricingRef = line.ele('cac:PricingReference');
      const altPrice = pricingRef.ele('cac:AlternativeConditionPrice');
      altPrice
        .ele('cbc:PriceAmount', { currencyID: dto.tipoMoneda })
        .txt(d.mtoPrecioUnitario.toFixed(6))
        .up();
      const priceTypeCode = TIPO_AFECTACION_GRATUITAS.includes(d.tipAfeIgv)
        ? '02'
        : '01';
      altPrice.ele('cbc:PriceTypeCode').txt(priceTypeCode).up();

      // Impuestos por línea
      const taxTotalLine = line.ele('cac:TaxTotal');

      if (d.icbper && d.icbper > 0) {
        // Este es obligatorio y va primero
        taxTotalLine
          .ele('cbc:TaxAmount', { currencyID: dto.tipoMoneda })
          .txt(d.totalImpuestos.toFixed(2))
          .up();

        // // Genera el nodo TaxSubtotal con IGV (código 1000) solo para líneas con afectación gravada
        if (TIPO_AFECTACION_GRAVADAS.includes(d.tipAfeIgv)) {
          // Operacion grabadas
          XmlCommonBuilder.agregarDetalleSubtotalIcbper(
            taxTotalLine,
            d.mtoBaseIgv,
            d.igv,
            d.porcentajeIgv,
            String(d.tipAfeIgv),
            dto.tipoMoneda,
            MAP_TRIBUTOS.IGV,
          );
        } else {
          // Agrega el tributo IGV requerido por SUNAT en operaciones exoneradas o inafectas
          // (SUNAT exige siempre un TaxSubtotal con IGV, incluso si la línea solo tiene ICBPER)
          const mapTributo = TIPO_AFECTACION_EXONERADAS.includes(d.tipAfeIgv)
            ? MAP_TRIBUTOS.EXO
            : MAP_TRIBUTOS.INA;
          XmlCommonBuilder.agregarDetalleSubtotalIcbper(
            taxTotalLine,
            d.mtoBaseIgv,
            0,
            0,
            String(d.tipAfeIgv),
            dto.tipoMoneda,
            mapTributo,
          );
        }
        //// Agrega el TaxSubtotal correspondiente al ICBPER (impuesto por bolsa plástica),
        // indicando la cantidad de bolsas y el monto por unidad
        if (d.icbper > 0) {
          XmlCommonBuilder.agregarDetalleSubtotalIcbper(
            taxTotalLine,
            0,
            d.icbper,
            0,
            String(d.tipAfeIgv),
            dto.tipoMoneda,
            MAP_TRIBUTOS.ICBPER,
            { baseUnit: d.unidad, qty: d.cantidad, perUnit: d.mtoPrecioUnitario },
          );
        }
      } else {
        // Caso normal IGV / Exonerado / Inafecto
        taxTotalLine
          .ele('cbc:TaxAmount', { currencyID: dto.tipoMoneda })
          .txt(d.totalImpuestos.toFixed(2));
        const sub = taxTotalLine.ele('cac:TaxSubtotal');
        sub
          .ele('cbc:TaxableAmount', { currencyID: dto.tipoMoneda })
          .txt(d.mtoValorUnitario.toFixed(2))
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
        scheme.ele('cbc:TaxTypeCode').txt(tributo.taxTypeCode);
      }

      // Producto
      line.ele('cac:Item').ele('cbc:Description').dat(d.descripcion);
      let precioUnitario = d.mtoPrecioUnitario;
      if (TIPO_AFECTACION_GRAVADAS.includes(d.tipAfeIgv)) {
        // factura Grabada se necesita precio sin igv
        precioUnitario = d.mtoPrecioUnitario / 1.18;
      }
      line
        .ele('cac:Price')
        .ele('cbc:PriceAmount', { currencyID: dto.tipoMoneda })
        .txt(precioUnitario?.toFixed(6));
    });
    return root.end({ prettyPrint: true });
  }
  private agruparTotalesPorTipoAfetiGV(
    dto: CreateInvoiceDto,
    totalesPorTributo: any,
  ) {
    for (const item of dto.details) {
      // 1. Afectaciones IGV, EXO, INA, EXP
      const tributo = MAP_TIPO_AFECTACION_TRIBUTO[item.tipAfeIgv];
      if (tributo) {
        const key = tributo.id;
        if (!totalesPorTributo[key]) {
          totalesPorTributo[key] = { taxable: 0, tax: 0, info: tributo };
        }
        let taxableAmount = 0;
        if (TIPO_AFECTACION_GRAVADAS.includes(item.tipAfeIgv)) {
          taxableAmount = item.mtoBaseIgv ?? 0;
        } else {
          taxableAmount = item.mtoValorVenta ?? 0;
        }
        totalesPorTributo[key].taxable += taxableAmount;
        totalesPorTributo[key].tax += item.igv ?? 0;
      }

      // 2. ICBPER (ya viene total en DTO)
      if (item.icbper && item.icbper > 0) {
        const tributoICBPER = MAP_TRIBUTOS.ICBPER;
        const key = tributoICBPER.id;
        if (!totalesPorTributo[key]) {
          totalesPorTributo[key] = { taxable: 0, tax: 0, info: tributoICBPER };
        }
        totalesPorTributo[key].tax += item.icbper; // usar total directo
      }
    }
  }

  private addTotalesImpuestos(
    root: any,
    totalesPorTributo: any,
    tipoMoneda: string
  ) {
    const taxTotal = root.ele('cac:TaxTotal');
    const taxtoTal:any = Object.values(totalesPorTributo)
    .reduce((acc: number, dd: any) => acc + (+dd.tax), 0);
    taxTotal
      .ele('cbc:TaxAmount', { currencyID: tipoMoneda })
      .txt(taxtoTal.toFixed(2))
      .up();
    const subtotales = Object.values(totalesPorTributo) as Array<{
      taxable: number;
      tax: number;
      info: { id: string; name: string; taxTypeCode: string };
    }>;

    // Ordenar para que primero vayan IGV/EXO/INA y luego ICBPER
    subtotales.sort((a, b) => {
      const prioridad = (id: string) => (id === MAP_TRIBUTOS.ICBPER.id ? 2 : 1);
      return prioridad(a.info.id) - prioridad(b.info.id);
    });

    // Ahora pintamos los TaxSubtotal en ese orden fijo
    for (const { taxable, tax, info } of subtotales) {
      const taxSub = taxTotal.ele('cac:TaxSubtotal');
      taxSub
        .ele('cbc:TaxableAmount', { currencyID: tipoMoneda })
        .txt(taxable.toFixed(2))
        .up()
        .ele('cbc:TaxAmount', { currencyID: tipoMoneda })
        .txt(tax.toFixed(2))
        .up();
        
      const taxCat = taxSub.ele('cac:TaxCategory');
      taxCat.ele('cbc:Percent').txt(18.00.toFixed(2)).up();
      taxCat.ele('cbc:TaxExemptionReasonCode').txt(info.taxTypeCode).up();
      const taxScheme = taxCat.ele('cac:TaxScheme');
      taxScheme.ele('cbc:ID').txt(info.id).up();
      taxScheme.ele('cbc:Name').txt(info.name).up();
      taxScheme.ele('cbc:TaxTypeCode').txt(info.taxTypeCode).up();
    }
  }
}
