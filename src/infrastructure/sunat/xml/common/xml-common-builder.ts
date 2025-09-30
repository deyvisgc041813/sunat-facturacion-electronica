import { CreateInvoiceDto } from "src/domain/comprobante/dto/invoice/CreateInvoiceDto";
import { CreateNotaDto } from "src/domain/comprobante/dto/notasComprobante/CreateNotaDto";
import { ComunicacionBajaDto } from "src/domain/comunicacion-baja/ComunicacionBajaDto";
import { ISummaryDocument } from "src/domain/resumen/interface/sunat.summary.interface";
import { MAP_TRIBUTOS } from "src/util/catalogo.enum";

export class XmlCommonBuilder {
  //   static buildHeader(xml: any, dto: any) {
  //     xml.ele('cbc:UBLVersionID').txt(dto.ublVersion).up();
  //     xml.ele('cbc:CustomizationID').txt(dto.customizationId).up();
  //     xml.ele('cbc:ID').txt(`${dto.serie}-${dto.correlativo}`).up();
  //     xml.ele('cbc:IssueDate').txt(dto.fechaEmision.split('T')[0]).up();
  //     xml.ele('cbc:IssueTime').txt(dto.fechaEmision.split('T')[1] || '00:00:00').up();
  //     xml.ele('cbc:InvoiceTypeCode').txt(dto.tipoComprobante).up();
  //     xml.ele('cbc:DocumentCurrencyCode').txt(dto.tipoMoneda).up();
  //   }

  static addUBLExtensions(root: any) {
    root
      .ele('ext:UBLExtensions')
      .ele('ext:UBLExtension')
      .ele('ext:ExtensionContent')
      .up()
      .up()
      .up();
  }
  static addDatosBasicos(
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
  static appendSignature(root: any, dto: CreateInvoiceDto | CreateNotaDto | ISummaryDocument | ComunicacionBajaDto) {
    const signature = root.ele('cac:Signature');
    signature.ele('cbc:ID').txt(dto.signatureId).up(); //'signatureFACTURALOPERU'
    signature.ele('cbc:Note').txt(dto.signatureNote).up(); // 'FACTURALO'
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
      .txt(`#${dto.signatureId}`);
  }
  static addCompany(root: any, dto: CreateInvoiceDto | CreateNotaDto) {
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
      dto.company?.address?.ubigueo,
      dto.company?.address?.provincia,
      dto.company?.address?.departamento,
      dto.company?.address?.distrito,
      dto.company?.address?.direccion,
      true,
      dto.codigoEstablecimientoSunat
    );
    const contact = supplier.ele('cac:Contact');
    contact.ele('cbc:Telephone').txt(`(051)${dto.telefonoEmpresa}`).up();
    contact.ele('cbc:ElectronicMail').txt(dto.correoEmpresa).up();
  }
  static addCustomer(root: any, dto: CreateInvoiceDto | CreateNotaDto) {
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
      dto.client?.address?.ubigueo,
      dto.client?.address?.provincia,
      dto.client?.address?.departamento,
      dto.client?.address?.distrito,
      dto.client?.address?.direccion,
      false,
      dto.codigoEstablecimientoSunat
    );
  }
  static addAddres(
    supLegal: any,
    ubigeo: string,
    provincia: string,
    departamento: string,
    distrito: string,
    direccion: string,
    isSupplier: any = false,
    codigoEstablecimientoSunat:string
  ) {
    const supAddr = supLegal.ele('cac:RegistrationAddress');
    supAddr.ele('cbc:ID').txt(ubigeo).up();
    if (isSupplier) supAddr.ele('cbc:AddressTypeCode').txt(codigoEstablecimientoSunat); // validar
    supAddr.ele('cbc:CityName').txt(provincia).up();
    supAddr.ele('cbc:CountrySubentity').txt(departamento).up();
    supAddr.ele('cbc:District').txt(distrito).up();
    supAddr.ele('cac:AddressLine').ele('cbc:Line').dat(direccion).up();
    supAddr.ele('cac:Country').ele('cbc:IdentificationCode').txt('PE');
  }
  static buildCreditNoteLineDefault(
    root: any,
    dto: CreateNotaDto,
    t: any,
    lineId: number,
  ) {
    const line = root.ele('cac:CreditNoteLine');
    line.ele('cbc:ID').txt(lineId.toString()).up();
    line
      .ele('cbc:CreditedQuantity', { unitCode: t.unitCode })
      .txt(t.CreditedQuantity)
      .up();

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

    // Descripción del ítem
    const item = line.ele('cac:Item');
    item.ele('cbc:Description').txt(t.description).up();

    // Precio unitario
    const price = line.ele('cac:Price');
    price
      .ele('cbc:PriceAmount', { currencyID: dto.tipoMoneda })
      .txt(t.monto.toFixed(2))
      .up();
  }
  static agregarDetalleSubtotalIcbper(
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
    const reasonCodeFinal = MAP_TRIBUTOS.ICBPER.id == scheme.id ? "9996" : reasonCode 
    cat.ele('cbc:TaxExemptionReasonCode').txt(reasonCodeFinal).up();
    const schemeNode = cat.ele('cac:TaxScheme');
    schemeNode.ele('cbc:ID').txt(scheme.id).up();
    schemeNode.ele('cbc:Name').txt(scheme.name).up();
    schemeNode.ele('cbc:TaxTypeCode').txt(scheme.taxTypeCode).up();
  }
}
