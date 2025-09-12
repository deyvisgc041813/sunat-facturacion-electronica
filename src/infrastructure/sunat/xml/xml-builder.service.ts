
import { Injectable } from '@nestjs/common';
import { CreateComprobanteDto } from 'src/domain/comprobante/dto/CreateComprobanteDto';
import { create } from 'xmlbuilder2';

@Injectable()
export class XmlBuilderService {
  buildInvoice(dto: CreateComprobanteDto): string {
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

    // 👉 Bloque UBLExtensions (necesario para la firma digital SUNAT)
    root
      .ele('ext:UBLExtensions')
      .ele('ext:UBLExtension')
      .ele('ext:ExtensionContent')
      .up()
      .up()
      .up();

    // Datos básicos

    root
      .ele('cbc:UBLVersionID')
      .txt(dto.ublVersion)
      .up()
      .ele('cbc:CustomizationID')
      .txt('2.0')
      .up()
      // .ele('cbc:ProfileID')
      // .txt(dto.tipoOperacion)
      // .up() // Operación: Venta interna
      .ele('cbc:ID')
      .txt(`${dto.serie}-${dto.correlativo}`)
      .up()
      .ele('cbc:IssueDate')
      .txt(dto.fechaEmision.split('T')[0])
      .up()
      .ele('cbc:IssueTime')
// 🔥 Esto elimina el offset "-05:00" y deja solo HH:mm:ss
      .txt(dto.fechaEmision.split('T')[1]?.substring(0, 8) || '00:00:00')
      .up()
      .ele('cbc:DueDate')
      .txt(dto.fechaEmision.split('T')[0])
      .up()

      .ele('cbc:InvoiceTypeCode', { listID: dto.tipoOperacion })
      .txt(dto.tipoDoc)
      .up();
      dto.legends.forEach((l) => {
        root.ele('cbc:Note', { languageLocaleID: l.code }).dat(l.value);
      });
      root.ele('cbc:DocumentCurrencyCode')
      .txt(dto.tipoMoneda)
      .up()
      // DueDate => esto se agrega cuando se hace una factura por tipo de pago credito: aqui va la fecha de vencimiento de ese pago.( hacer luego)

    // 🔹 3. Firma (cac:Signature) inmediatamente después de DocumentCurrencyCode
    const signature = root.ele('cac:Signature');
    signature.ele('cbc:ID').txt('signatureFACTURALOPERU').up();
    signature.ele('cbc:Note').txt('FACTURALO').up();
    const signatory = signature.ele('cac:SignatoryParty');
    signatory.ele('cac:PartyIdentification').ele('cbc:ID').txt(dto.company.ruc).up().up();
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


    // emisor
    const supplier = root.ele('cac:AccountingSupplierParty').ele('cac:Party');
    supplier
      .ele('cac:PartyIdentification')
      .ele('cbc:ID', { schemeID: '6' })
      .txt(dto.company.ruc)
      .up()
      .up();
    // supplier
    //   .ele('cac:PartyName')
    //   .ele('cbc:Name')
    //   .txt(dto.company.nombreComercial ?? '')
    //   .up();
      supplier.ele('cac:PartyName').ele('cbc:Name').dat(dto.company.nombreComercial ?? '').up();

    const supLegal = supplier.ele('cac:PartyLegalEntity');
    supLegal.ele('cbc:RegistrationName').dat(dto.company.razonSocial).up();
    const supAddr = supLegal.ele('cac:RegistrationAddress');
    supAddr.ele('cbc:ID').txt(dto.company.address.ubigueo).up();
    supAddr.ele('cbc:AddressTypeCode').txt('0000'); // validar
    supAddr.ele('cbc:CityName').txt(dto.company.address.provincia).up();
    supAddr
      .ele('cbc:CountrySubentity')
      .txt(dto.company.address.departamento)
      .up();
    supAddr.ele('cbc:District').txt(dto.company.address.distrito).up();
    supAddr
      .ele('cac:AddressLine')
      .ele('cbc:Line')
      .dat(dto.company.address.direccion ?? '').up();


    supAddr.ele('cac:Country').ele('cbc:IdentificationCode').txt('PE');
    const contact = supplier.ele('cac:Contact');
    contact.ele('cbc:Telephone').txt('(051) 931091443').up();
    contact.ele('cbc:ElectronicMail').txt('rdinersiones@gmail.com').up();

    // cliente

    const customer = root.ele('cac:AccountingCustomerParty').ele('cac:Party');
    customer
      .ele('cac:PartyIdentification')
      .ele('cbc:ID', { schemeID: dto.client.tipoDoc })
      .txt(dto.client.numDoc)
      .up()
      .up();
    const custLegal = customer.ele('cac:PartyLegalEntity');
    custLegal.ele('cbc:RegistrationName').dat(dto.client.rznSocial).up();
    const custAddr = custLegal.ele('cac:RegistrationAddress');
    custAddr.ele('cbc:ID').txt(dto.client.address.ubigueo).up();
    custAddr.ele('cbc:CityName').txt(dto.client.address.provincia).up();
    custAddr
      .ele('cbc:CountrySubentity')
      .txt(dto.client.address.departamento)
      .up();
    custAddr.ele('cbc:District').txt(dto.client.address.distrito).up();
    custAddr
      .ele('cac:AddressLine')
      .ele('cbc:Line')
      .dat(dto.client.address.direccion ?? '').up();
    custAddr.ele('cac:Country').ele('cbc:IdentificationCode').txt('PE');
    // Medio de pago
    // root.ele('cac:PaymentMeans')
    //   .ele('cbc:ID').txt('1').up()
    //   .ele('cbc:PaymentMeansCode').txt(dto.formaPago.tipo).up();

    root
      .ele('cac:PaymentTerms')
      .ele('cbc:ID')
      .txt('FormaPago')
      .up()
      .ele('cbc:PaymentMeansID')
      .txt(dto.formaPago.tipo)
      .up();

    // 👉 Totales de impuestos
    const taxTotal = root.ele('cac:TaxTotal');
    taxTotal
      .ele('cbc:TaxAmount', { currencyID: dto.tipoMoneda })
      .txt(dto.mtoIGV.toFixed(2));
    const taxSub = taxTotal.ele('cac:TaxSubtotal');
    taxSub
      .ele('cbc:TaxableAmount', { currencyID: dto.tipoMoneda })
      .txt(dto.mtoOperGravadas.toFixed(2))
      .up();
    taxSub
      .ele('cbc:TaxAmount', { currencyID: dto.tipoMoneda })
      .txt(dto.mtoIGV.toFixed(2))
      .up();
    const taxCat = taxSub.ele('cac:TaxCategory');
    const taxScheme = taxCat.ele('cac:TaxScheme');
    taxScheme.ele('cbc:ID').txt('1000').up();
    taxScheme.ele('cbc:Name').txt('IGV').up();
    taxScheme.ele('cbc:TaxTypeCode').txt('VAT');
  // 👉 Totales monetarios
    root
      .ele('cac:LegalMonetaryTotal')
      .ele('cbc:LineExtensionAmount', { currencyID: dto.tipoMoneda })
      .txt(dto.mtoOperGravadas.toFixed(2))
      .up()
      .ele('cbc:TaxInclusiveAmount', { currencyID: dto.tipoMoneda })
      .txt(dto.subTotal.toFixed(2))
      .up()
      .ele('cbc:PayableAmount', { currencyID: dto.tipoMoneda })
      .txt(dto.mtoImpVenta.toFixed(2));
    // 👉 Leyendas



    // 👉 Detalle de líneas
    dto.details.forEach((d, i) => {
      const line = root.ele('cac:InvoiceLine');
      line.ele('cbc:ID').txt(String(i + 1));
      line
        .ele('cbc:InvoicedQuantity', { unitCode: d.unidad })
        .txt(d.cantidad.toFixed(4));
      line
        .ele('cbc:LineExtensionAmount', { currencyID: dto.tipoMoneda })
        .txt(d.mtoValorUnitario.toFixed(2));
      // 👉 Precio de referencia (SUNAT exige precio unitario con IGV)
      const pricingRef = line.ele('cac:PricingReference');
      const altPrice = pricingRef.ele('cac:AlternativeConditionPrice');
      altPrice
        .ele('cbc:PriceAmount', { currencyID: dto.tipoMoneda })
        .txt(d.mtoPrecioUnitario.toFixed(6))
        .up();
      altPrice.ele('cbc:PriceTypeCode').txt('01').up(); // 01 = Precio unitario (incluye IGV) // validar

      // 👉 Impuestos por línea
      const taxTotalLine = line.ele('cac:TaxTotal');
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
      cat.ele('cbc:TaxExemptionReasonCode').txt(String(d.tipAfeIgv)).up(); // Operación gravada
      const scheme = cat.ele('cac:TaxScheme');
      scheme.ele('cbc:ID').txt('1000').up();
      scheme.ele('cbc:Name').txt('IGV').up();
      scheme.ele('cbc:TaxTypeCode').txt('VAT');

      // 👉 Producto
      line.ele('cac:Item').ele('cbc:Description').dat(d.descripcion);
      // 👉 Precio sin 
      const precioSinIgv = d.mtoPrecioUnitario / 1.18;
      line
        .ele('cac:Price')
        .ele('cbc:PriceAmount', { currencyID: dto.tipoMoneda })
        .txt(precioSinIgv?.toFixed(6));
    });

  

    return root.end({ prettyPrint: true });
  }
  // XML mínimo de prueba (solo cabecera)
  buildInvoiceMinimal(): string {
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

  // 🔹 Bloque obligatorio para la firma
  root
    .ele('ext:UBLExtensions')
    .ele('ext:UBLExtension')
    .ele('ext:ExtensionContent')
    .up()
    .up()
    .up();

  // 🔹 Datos mínimos
  root.ele('cbc:UBLVersionID').txt('2.1').up();
  root.ele('cbc:CustomizationID').txt('2.0').up();
  root.ele('cbc:ID').txt('F001-1').up();
  root.ele('cbc:IssueDate').txt('2025-09-12').up();
  root.ele('cbc:InvoiceTypeCode', { listID: '0101' }).txt('01').up();
  root.ele('cbc:DocumentCurrencyCode').txt('PEN').up();

  // 🔹 Firma (cac:Signature)
  const signature = root.ele('cac:Signature');
  signature.ele('cbc:ID').txt('signatureFACTURALOPERU').up();
  signature.ele('cbc:Note').txt('FACTURALO').up();
  const signatory = signature.ele('cac:SignatoryParty');
  signatory
    .ele('cac:PartyIdentification')
    .ele('cbc:ID')
    .txt('20000000001') // ⚡ RUC de prueba SUNAT
    .up()
    .up();
  signatory
    .ele('cac:PartyName')
    .ele('cbc:Name')
    .dat('EMPRESA PRUEBA SUNAT')
    .up();
  const digitalAttachment = signature.ele('cac:DigitalSignatureAttachment');
  digitalAttachment
    .ele('cac:ExternalReference')
    .ele('cbc:URI')
    .txt('#signatureFACTURALOPERU');

  // 🔹 Emisor (SUNAT prueba)
  const supplier = root.ele('cac:AccountingSupplierParty').ele('cac:Party');
  supplier
    .ele('cac:PartyIdentification')
    .ele('cbc:ID', { schemeID: '6' })
    .txt('20000000001') // ⚡ RUC de prueba SUNAT
    .up()
    .up();
  const supLegal = supplier.ele('cac:PartyLegalEntity');
  supLegal.ele('cbc:RegistrationName').dat('EMPRESA PRUEBA SUNAT').up();

  // 🔹 Cliente ficticio
  const customer = root.ele('cac:AccountingCustomerParty').ele('cac:Party');
  customer
    .ele('cac:PartyIdentification')
    .ele('cbc:ID', { schemeID: '6' })
    .txt('10425495564')
    .up()
    .up();
  const custLegal = customer.ele('cac:PartyLegalEntity');
  custLegal.ele('cbc:RegistrationName').dat('CLIENTE PRUEBA').up();

  // 🔹 Totales en 0.00
  const taxTotal = root.ele('cac:TaxTotal');
  taxTotal.ele('cbc:TaxAmount', { currencyID: 'PEN' }).txt('0.00');
  const taxSub = taxTotal.ele('cac:TaxSubtotal');
  taxSub.ele('cbc:TaxableAmount', { currencyID: 'PEN' }).txt('0.00').up();
  taxSub.ele('cbc:TaxAmount', { currencyID: 'PEN' }).txt('0.00').up();
  const taxCat = taxSub.ele('cac:TaxCategory');
  const taxScheme = taxCat.ele('cac:TaxScheme');
  taxScheme.ele('cbc:ID').txt('1000').up();
  taxScheme.ele('cbc:Name').txt('IGV').up();
  taxScheme.ele('cbc:TaxTypeCode').txt('VAT');

  const legalTotal = root.ele('cac:LegalMonetaryTotal');
  legalTotal.ele('cbc:LineExtensionAmount', { currencyID: 'PEN' }).txt('0.00').up();
  legalTotal.ele('cbc:TaxInclusiveAmount', { currencyID: 'PEN' }).txt('0.00').up();
  legalTotal.ele('cbc:PayableAmount', { currencyID: 'PEN' }).txt('0.00');

  return root.end({ prettyPrint: true });
}

}
