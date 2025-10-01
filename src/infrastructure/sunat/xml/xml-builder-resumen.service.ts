import { Injectable } from '@nestjs/common';
import { IDocumento, ISummaryDocument } from 'src/domain/resumen/interface/sunat.summary.interface';
import {
  formatDateForSunat,
  generarTributosRC,
  mapEstadoRC,
} from 'src/util/Helpers';
import { create } from 'xmlbuilder2';
import { XmlCommonBuilder } from './common/xml-common-builder';
import { MAP_TRIBUTOS, MTO_CERO } from 'src/util/constantes';

@Injectable()
export class XmlBuilderResumenService {
  buildResumenBoletas(dto: ISummaryDocument): string {
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
    // Bloque UBLExtensions (necesario para la firma digital SUNAT)
    XmlCommonBuilder.addUBLExtensions(root);

    XmlCommonBuilder.addDatosBasicos(
      root,
      dto.ublVersion,
      dto.customizationID,
      dto.resumenId,
    )
      .ele('cbc:ReferenceDate')
      .txt(formatDateForSunat(dto.fecReferencia)) // fecha de emison de las boletas
      .up()
      .ele('cbc:IssueDate')
      .txt(formatDateForSunat(dto.fechaEnvio))
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
      line
        .ele('cac:Status')
        .ele('cbc:ConditionCode')
        .txt(mapEstadoRC(doc.estado))
        .up()
        .up();
      line
        .ele('sac:TotalAmount', { currencyID: doc.tipoMoneda })
        .txt(doc.total.toFixed(2))
        .up();
      const tributos = generarTributosRC(doc); // usa boleta o doc, pero consistente
      tributos.forEach((t) => {
        line
          .ele('sac:BillingPayment')
          .ele('cbc:PaidAmount', { currencyID: doc.tipoMoneda })
          .txt(t.billingPayment.amount.toFixed(2))
          .up()
          .ele('cbc:InstructionID')
          .txt(t.billingPayment.instructionID)
          .up()
          .up();
      });
      // 2. Calcular total de impuestos
      const totalImpuestos = tributos.reduce(
        (sum, t) => sum + t.taxSubtotal.amount,
        0,
      );

      // 3. Crear un único TaxTotal
      const taxTotal = line
        .ele('cac:TaxTotal')
        .ele('cbc:TaxAmount', { currencyID: doc.tipoMoneda })
        .txt(totalImpuestos.toFixed(2))
        .up();
       this.buildDefaultTaxtolIGV(doc, taxTotal) 
      // 4. Dentro de ese TaxTotal, iterar los TaxSubtotal
      tributos.forEach((t) => {
        taxTotal
          .ele('cac:TaxSubtotal')
          .ele('cbc:TaxAmount', { currencyID: doc.tipoMoneda })
          .txt(t.taxSubtotal.amount.toFixed(2))
          .up()
          .ele('cac:TaxCategory')
          .ele('cac:TaxScheme')
          .ele('cbc:ID')
          .txt(t.taxSubtotal.id)
          .up()
          .ele('cbc:Name')
          .txt(t.taxSubtotal.name)
          .up()
          .ele('cbc:TaxTypeCode')
          .txt(t.taxSubtotal.taxTypeCode)
          .up()
          .up()
          .up()
          .up();
      });
    });
    return root.end({ prettyPrint: true });
  }
  private buildDefaultTaxtolIGV (doc:IDocumento, taxTotal: any) {
      if (
        (doc.mtoOperExoneradas > 0 || doc.mtoOperInafectas > 0) &&
        doc.mtoOperGravadas === 0
      ) {
        taxTotal
          .ele('cac:TaxSubtotal')
          .ele('cbc:TaxAmount', { currencyID: doc.tipoMoneda })
          .txt(MTO_CERO)
          .up()
          .ele('cac:TaxCategory')
          .ele('cac:TaxScheme')
          .ele('cbc:ID')
          .txt(MAP_TRIBUTOS.IGV.id)
          .up()
          .ele('cbc:Name')
          .txt(MAP_TRIBUTOS.IGV.name)
          .up()
          .ele('cbc:TaxTypeCode')
          .txt(MAP_TRIBUTOS.IGV.taxTypeCode)
          .up()
          .up()
          .up()
          .up();
      }
  }
}
