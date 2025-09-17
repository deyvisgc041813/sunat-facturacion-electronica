import { CreateInvoiceDto } from "src/domain/comprobante/dto/invoice/CreateInvoiceDto";
import { CreateNotaDto } from "src/domain/comprobante/dto/notasComprobante/CreateNotaDto";

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
  static appendSignature(root: any, dto: CreateInvoiceDto | CreateNotaDto) {
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
    );
    const contact = supplier.ele('cac:Contact');
    contact.ele('cbc:Telephone').txt('(051) 931091443').up(); // aqui falta  hacelro dinamico
    contact.ele('cbc:ElectronicMail').txt('rdinersiones@gmail.com').up(); // aqui falta  hacelro dinamico
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
}
