import { Injectable } from '@nestjs/common';
import {
  formatDateForSunat,
} from 'src/util/Helpers';
import { create } from 'xmlbuilder2';
import { XmlCommonBuilder } from './common/xml-common-builder';
import { ComunicacionBajaDto } from 'src/domain/comunicacion-baja/ComunicacionBajaDto';

@Injectable()
export class XmlBuilderComunicacionBajaService {
  buildComunicacionBaja(
    dto: ComunicacionBajaDto,
    serie: string,
    fechaEnvio: Date,
  ): string {
    const root = create({ version: '1.0', encoding: 'UTF-8' }).ele(
      'VoidedDocuments',
      {
        xmlns:
          'urn:sunat:names:specification:ubl:peru:schema:xsd:VoidedDocuments-1',
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
    // Bloque UBLExtensions (necesario para la firma digital SUNAT)
    XmlCommonBuilder.addUBLExtensions(root);

    XmlCommonBuilder.addDatosBasicos(
      root,
      dto.ublVersion,
      dto.customizationId,
      serie,
    )
      .ele('cbc:ReferenceDate')
      .txt(formatDateForSunat(new Date(dto.fecReferencia))) // fecha de emison de las boletas
      .up()
      .ele('cbc:IssueDate')
      .txt(formatDateForSunat(new Date(fechaEnvio)))
      .up();

    // 3. Firma (cac:Signature) inmediatamente después de
    XmlCommonBuilder.appendSignature(root, dto);

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

    dto.detalles.forEach((doc, index) => {
      const line = root.ele('sac:VoidedDocumentsLine');

      // 1. Linea correlativa
      line
        .ele('cbc:LineID')
        .txt((index + 1).toString())
        .up();

      // 2. Tipo de comprobante (01=Factura, 03=Boleta, 07=NC, 08=ND)
      line.ele('cbc:DocumentTypeCode').txt(doc.tipoComprobante).up();

      // 3. Serie
      line.ele('sac:DocumentSerialID').txt(doc.serie).up();

      // 4. Número correlativo del comprobante
      line.ele('sac:DocumentNumberID').txt(doc.correlativo.toString()).up();

      // 5. Motivo de baja
      line.ele('sac:VoidReasonDescription').dat(doc.motivo).up();
    });

    return root.end({ prettyPrint: true });
  }
}
