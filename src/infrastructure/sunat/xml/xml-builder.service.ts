import { Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from 'src/domain/comprobante/dto/invoice/CreateInvoiceDto';
import { SummaryDocumentDto } from 'src/domain/comprobante/dto/resumen/SummaryDocumentDto';
import {
  MAP_TIPO_AFECTACION_TRIBUTO,
  MAP_TRIBUTOS,
  TIPO_AFECTACION_EXONERADAS,
  TIPO_AFECTACION_GRATUITAS,
  TIPO_AFECTACION_GRAVADAS,
} from 'src/util/catalogo.enum';
import { create } from 'xmlbuilder2';

@Injectable()
export class XmlBuilderService {
  buildInvoiceXml(dto: CreateInvoiceDto): string {
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
    this.addUBLExtensions(root);
    // Datos básicos
    this.addDatosBasicos(
      root,
      dto.ublVersion,
      '2.0',
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
    // DueDate => esto se agrega cuando se hace una factura por tipo de pago credito: aqui va la fecha de vencimiento de ese pago.( hacer luego)
    // 3. Firma (cac:Signature) inmediatamente después de DocumentCurrencyCode
    this.appendSignature(root, dto);
    // emisor
    this.addCompany(root, dto);
    // cliente
    this.addCustomer(root, dto);
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
      dto.tipoMoneda,
      dto.mtoIGV
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
      .txt((mtoOperacion + (dto.mtoIGV ?? 0)).toFixed(2))
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
        // Calcular ICBPER
        const montoIcbper = d.icbper ? d.icbper * d.cantidad : 0;

        // Total impuestos de la línea
        const totalLinea = TIPO_AFECTACION_GRAVADAS.includes(d.tipAfeIgv) ? d.igv + montoIcbper : montoIcbper;
        // Este es obligatorio y va primero
        taxTotalLine
          .ele('cbc:TaxAmount', { currencyID: dto.tipoMoneda })
          .txt(totalLinea.toFixed(2))
          .up();

        // // Genera el nodo TaxSubtotal con IGV (código 1000) solo para líneas con afectación gravada
        if (TIPO_AFECTACION_GRAVADAS.includes(d.tipAfeIgv)) {
          // Operacion grabadas
          this.agregarDetalleSubtotalIcbper(
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
          const mapTributo = TIPO_AFECTACION_EXONERADAS.includes(d.tipAfeIgv) ? MAP_TRIBUTOS.EXO : MAP_TRIBUTOS.INA
          this.agregarDetalleSubtotalIcbper(
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
        if (montoIcbper > 0) {
          this.agregarDetalleSubtotalIcbper(
            taxTotalLine,
            0,
            montoIcbper,
            0,
            String(d.tipAfeIgv),
            dto.tipoMoneda,
            MAP_TRIBUTOS.ICBPER,
            { baseUnit: d.unidad, qty: d.cantidad, perUnit: d.icbper },
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
  buildResumenBoletas(dto: SummaryDocumentDto): string {
    const root = create({ version: '1.0', encoding: 'UTF-8' }).ele(
      'SummaryDocuments',
      {
        xmlns:
          'urn:sunat:names:specification:ubl:peru:schema:xsd:SummaryDocuments-1',
        'xmlns:cac':
          'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        'xmlns:cbc':
          'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
        'xmlns:ext':
          'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
        'xmlns:sac':
          'urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      },
    );
    // 👉 Bloque UBLExtensions (necesario para la firma digital SUNAT)
    root
      .ele('ext:UBLExtensions')
      .ele('ext:UBLExtension')
      .ele('ext:ExtensionContent')
      .up()
      .up()
      .up();

    root
      .ele('cbc:UBLVersionID')
      .txt(dto.ublVersion)
      .up()
      .ele('cbc:CustomizationID')
      .txt('1.1')
      .up()
      .ele('cbc:ID')
      .txt(dto.resumenId)
      .up()
      .ele('cbc:ReferenceDate')
      .txt(dto.fecGeneracion.split('T')[0]) // fecha de emison de las boletas
      .up()
      .ele('cbc:IssueDate')
      .txt(dto.fecResumen.split('T')[0])
      .up();
    // 3. Firma (cac:Signature) inmediatamente después de DocumentCurrencyCode
    const signature = root.ele('cac:Signature');
    signature.ele('cbc:ID').txt('signatureFACTURALOPERU').up();
    signature.ele('cbc:Note').txt('FACTURALO').up();
    const signatory = signature.ele('cac:SignatoryParty');
    signatory
      .ele('cac:PartyIdentification')
      .ele('cbc:ID')
      .txt(dto.company.ruc)
      .up()
      .up();
    signatory
      .ele('cac:PartyName')
      .ele('cbc:Name')
      .dat(dto.company.razonSocial)
      .up();
    const digitalAttachment = signature.ele('cac:DigitalSignatureAttachment');
    digitalAttachment
      .ele('cac:ExternalReference')
      .ele('cbc:URI')
      .txt('#signatureFACTURALOPERU');

    // emisor (empresa)
    root
      .ele('cac:AccountingSupplierParty')
      .ele('cbc:CustomerAssignedAccountID')
      .txt(dto.company.ruc)
      .up()
      .ele('cbc:AdditionalAccountID')
      .txt(dto.company.tipoDoc)
      .up() // normalmente "6" = RUC
      .ele('cac:Party')
      .ele('cac:PartyLegalEntity')
      .ele('cbc:RegistrationName')
      .dat(dto.company.razonSocial)
      .up()
      .up()
      .up()
      .up();

    dto.documentos.forEach((doc) => {
      const line = root.ele('sac:SummaryDocumentsLine');
      line.ele('cbc:LineID').txt(doc.linea.toString()).up();
      line.ele('cbc:DocumentTypeCode').txt(doc.tipoDoc).up();
      line.ele('cbc:ID').txt(doc.serieNumero).up();
      line
        .ele('cac:AccountingCustomerParty')
        .ele('cbc:CustomerAssignedAccountID')
        .txt(doc.cliente.numDoc)
        .up()
        .ele('cbc:AdditionalAccountID')
        .txt(doc.cliente.tipoDoc)
        .up()
        .up();

      //
      /**
       * estados sunat :
       * 1 → Comprobante informado normalmente (incluir en el resumen).
       * 2 → Anulado.
       *
       */
      line.ele('cac:Status').ele('cbc:ConditionCode').txt(doc.estado).up().up();

      line
        .ele('sac:TotalAmount', { currencyID: doc.tipoMoneda })
        .txt(doc.total.toFixed(2))
        .up();

      doc.pagos.forEach((p) => {
        line
          .ele('sac:BillingPayment')
          .ele('cbc:PaidAmount', { currencyID: doc.tipoMoneda })
          .txt(p.monto.toFixed(2))
          .up()
          .ele('cbc:InstructionID')
          .txt(p.tipo)
          .up()
          .up();
      });

      line
        .ele('cac:TaxTotal')
        .ele('cbc:TaxAmount', { currencyID: doc.tipoMoneda })
        .txt(doc.igv.toFixed(2))
        .up()
        .ele('cac:TaxSubtotal')
        .ele('cbc:TaxAmount', { currencyID: doc.tipoMoneda })
        .txt(doc.igv.toFixed(2))
        .up()
        .ele('cac:TaxCategory')
        .ele('cac:TaxScheme')
        .ele('cbc:ID')
        .txt('1000')
        .up()
        .ele('cbc:Name')
        .txt('IGV')
        .up()
        .ele('cbc:TaxTypeCode')
        .txt('VAT')
        .up()
        .up()
        .up()
        .up()
        .up();
    });

    return root.end({ prettyPrint: true });
  }
  private addUBLExtensions(root: any) {
    root
      .ele('ext:UBLExtensions')
      .ele('ext:UBLExtension')
      .ele('ext:ExtensionContent')
      .up()
      .up()
      .up();
  }
  private addDatosBasicos(
    root: any,
    ublVersion: string,
    customizationID: string,
    id: string,
  ) {
    root
      .ele('cbc:UBLVersionID')
      .txt(ublVersion)
      .up()
      .ele('cbc:CustomizationID')
      .txt(customizationID)
      .up()
      .ele('cbc:ID')
      .txt(id)
      .up();
    return root;
  }
  // Firma digital base
  private appendSignature(root: any, dto: CreateInvoiceDto) {
    const signature = root.ele('cac:Signature');
    signature.ele('cbc:ID').txt('signatureFACTURALOPERU').up();
    signature.ele('cbc:Note').txt('FACTURALO').up();
    const signatory = signature.ele('cac:SignatoryParty');
    signatory
      .ele('cac:PartyIdentification')
      .ele('cbc:ID')
      .txt(dto.company.ruc)
      .up()
      .up();
    signatory
      .ele('cac:PartyName')
      .ele('cbc:Name')
      .dat(dto.company.razonSocial)
      .up();
    const digitalAttachment = signature.ele('cac:DigitalSignatureAttachment');
    digitalAttachment
      .ele('cac:ExternalReference')
      .ele('cbc:URI')
      .txt('#signatureFACTURALOPERU');
  }
  private addCompany(root: any, dto: CreateInvoiceDto) {
    const supplier = root.ele('cac:AccountingSupplierParty').ele('cac:Party');
    supplier
      .ele('cac:PartyIdentification')
      .ele('cbc:ID', { schemeID: dto.company.tipoDoc })
      .txt(dto.company.ruc)
      .up()
      .up();
    supplier
      .ele('cac:PartyName')
      .ele('cbc:Name')
      .dat(dto.company.nombreComercial ?? '')
      .up();
    const supLegal = supplier.ele('cac:PartyLegalEntity');
    supLegal.ele('cbc:RegistrationName').dat(dto.company.razonSocial).up();
    this.addAddres(
      supLegal,
      dto.company.address.ubigueo,
      dto.company.address.provincia,
      dto.company.address.departamento,
      dto.company.address.distrito,
      dto.company.address.direccion,
      true,
    );

    const contact = supplier.ele('cac:Contact');
    contact.ele('cbc:Telephone').txt('(051) 931091443').up(); // aqui falta  hacelro dinamico
    contact.ele('cbc:ElectronicMail').txt('rdinersiones@gmail.com').up(); // aqui falta  hacelro dinamico
    dto.company.address.ubigueo;
    dto.company.address.provincia;
    dto.company.address.departamento;
    dto.company.address.distrito;
    dto.company.address.direccion;
  }
  private addCustomer(root: any, dto: CreateInvoiceDto) {
    const customer = root.ele('cac:AccountingCustomerParty').ele('cac:Party');
    customer
      .ele('cac:PartyIdentification')
      .ele('cbc:ID', { schemeID: dto.client.tipoDoc })
      .txt(dto.client.numDoc)
      .up()
      .up();
    const custLegal = customer.ele('cac:PartyLegalEntity');
    custLegal.ele('cbc:RegistrationName').dat(dto.client.rznSocial).up(); // va el nombre o la razon social del cliente

    this.addAddres(
      custLegal,
      dto.client.address.ubigueo,
      dto.client.address.provincia,
      dto.client.address.departamento,
      dto.client.address.distrito,
      dto.client.address.direccion,
    );
  }
  private addAddres(
    supLegal: any,
    ubigeo: string,
    provincia: string,
    departamento: string,
    distrito: string,
    direccion: string,
    isSupplier: any = false,
  ) {
    const supAddr = supLegal.ele('cac:RegistrationAddress');
    supAddr.ele('cbc:ID').txt(ubigeo).up();
    if (isSupplier) supAddr.ele('cbc:AddressTypeCode').txt('0000'); // validar
    supAddr.ele('cbc:CityName').txt(provincia).up();
    supAddr.ele('cbc:CountrySubentity').txt(departamento).up();
    supAddr.ele('cbc:District').txt(distrito).up();
    supAddr.ele('cac:AddressLine').ele('cbc:Line').dat(direccion).up();
    supAddr.ele('cac:Country').ele('cbc:IdentificationCode').txt('PE');
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
        // Determinar taxable según tipo de afectación
        let taxableAmount = 0;
        if (TIPO_AFECTACION_GRAVADAS.includes(item.tipAfeIgv)) {
          taxableAmount = item.mtoBaseIgv ?? 0; // Gravadas usan base imponible
        } else {
          taxableAmount = item.mtoValorVenta ?? 0; // Exoneradas / Inafectas / Exportación usan valor de venta
        }
        console.log("taxableAmount ", taxableAmount)
        totalesPorTributo[key].taxable += taxableAmount;
        totalesPorTributo[key].tax += item.igv ?? 0;
      }

      // 2. ICBPER (no depende de tipAfeIgv)
      if (item.icbper && item.icbper > 0) {
        const montoIcbper = item.icbper * (item.cantidad ?? 1);
        const tributoICBPER = MAP_TRIBUTOS.ICBPER; // se saca del mapa
        const key = tributoICBPER.id;
        if (!totalesPorTributo[key]) {
          totalesPorTributo[key] = { taxable: 0, tax: 0, info: tributoICBPER };
        }
        totalesPorTributo[key].tax += montoIcbper;
      }
    }
  }
  private addTotalesImpuestos(
    root: any,
    totalesPorTributo: any,
    tipoMoneda: string,
    mtoIgv: any,
  ) {
    const taxTotal = root.ele('cac:TaxTotal');
    taxTotal
      .ele('cbc:TaxAmount', { currencyID: tipoMoneda })
      .txt(mtoIgv.toFixed(2))
      .up();

    const subtotales = Object.values(totalesPorTributo) as Array<{
      taxable: number;
      tax: number;
      info: { id: string; name: string; taxTypeCode: string };
    }>;

    // Ordenar para que primero vayan IGV/EXO/INA y luego ICBPER
    subtotales.sort((a, b) => {
      const prioridad = (id: string) => (id === '7152' ? 2 : 1);
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
      taxCat.ele('cbc:Percent').txt(mtoIgv.toFixed(2)).up();
      taxCat.ele('cbc:TaxExemptionReasonCode').txt("20").up();
      const taxScheme = taxCat.ele('cac:TaxScheme');
      taxScheme.ele('cbc:ID').txt(info.id).up();
      taxScheme.ele('cbc:Name').txt(info.name).up();
      taxScheme.ele('cbc:TaxTypeCode').txt(info.taxTypeCode).up();
      
    }
  }
  private agregarDetalleSubtotalIcbper(
    parent: any,
    taxableAmount: number,
    taxAmount: number,
    percent: number,
    reasonCode: string,
    tipoMoneda: string,
    scheme: { id: string; name: string; taxTypeCode: string },
    extra?: { baseUnit?: string; qty?: number; perUnit?: number },
  ) {
    const sub = parent.ele('cac:TaxSubtotal');
    sub
      .ele('cbc:TaxableAmount', { currencyID: tipoMoneda })
      .txt(taxableAmount.toFixed(2))
      .up();

    sub
      .ele('cbc:TaxAmount', { currencyID: tipoMoneda })
      .txt(taxAmount.toFixed(2))
      .up();

    if (extra?.baseUnit) {
      sub
        .ele('cbc:BaseUnitMeasure', { unitCode: extra.baseUnit })
        .txt(String(extra.qty))
        .up();
      sub
        .ele('cbc:PerUnitAmount', { currencyID: tipoMoneda })
        .txt(extra.perUnit?.toFixed(2) ?? '0.00')
        .up();
    }
    const cat = sub.ele('cac:TaxCategory');
    cat.ele('cbc:Percent').txt(percent.toFixed(2)).up();
    cat
      .ele('cbc:TaxExemptionReasonCode')
      .txt(reasonCode)
      .up();
    const schemeNode = cat.ele('cac:TaxScheme');
    schemeNode.ele('cbc:ID').txt(scheme.id).up();
    schemeNode.ele('cbc:Name').txt(scheme.name).up();
    schemeNode.ele('cbc:TaxTypeCode').txt(scheme.taxTypeCode).up();
  }
}
