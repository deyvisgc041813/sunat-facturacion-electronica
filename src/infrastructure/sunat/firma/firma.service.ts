import { Injectable } from '@nestjs/common';
import * as forge from 'node-forge';
import { SignedXml } from 'xml-crypto';
import { createPrivateKey } from 'crypto';
import { DOMParser, XMLSerializer } from 'xmldom';

class CertKeyInfoProvider {
  constructor(private cert: string) {}

  getKeyInfo() {
    return `
      <ds:X509Data>
        <ds:X509Certificate>${this.cert}</ds:X509Certificate>
      </ds:X509Data>
    `;
  }

  getKey() {
    return null;
  }
}

@Injectable()
export class FirmaService {
  async firmarXml(
    xml: string,
    pfxBuffer: Buffer,
    password: string,
    ruc: string,
    razonSocial: string,
  ): Promise<string> {
    // 1. Parsear PFX
    const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    // 2. Extraer clave privada
    const keyBagsPkcs8 = p12.getBags({
      bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
    });
    const keyBagsKey = p12.getBags({ bagType: forge.pki.oids.keyBag });
    const bag =
      keyBagsPkcs8[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0] ||
      keyBagsKey[forge.pki.oids.keyBag]?.[0];

    if (!bag?.key) {
      throw new Error('No se encontró la clave privada en el PFX.');
    }

    const privateKeyPem = forge.pki.privateKeyToPem(bag.key);
    const normalizedKey = createPrivateKey({
      key: privateKeyPem,
      format: 'pem',
    })
      .export({ format: 'pem', type: 'pkcs1' })
      .toString();

    // 3. Extraer certificado
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const cert = certBags[forge.pki.oids.certBag]?.[0]?.cert;
    if (!cert) {
      throw new Error('No se encontró el certificado en el PFX.');
    }
    const certificatePem = forge.pki.certificateToPem(cert);
    const certBase64 = certificatePem
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\r?\n|\r/g, '');

    // 4. Preparar XML y agregar <cac:Signature> antes de firmar
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');
    const ublExtensions = xmlDoc.getElementsByTagName('ext:UBLExtensions')[0];

    const cacSignatureXml = `
      <cac:Signature>
        <cbc:ID>signatureDIGITALPERU</cbc:ID>
        <cbc:Note>DIGITALPERU</cbc:Note>
        <cac:SignatoryParty>
          <cac:PartyIdentification>
            <cbc:ID>${ruc}</cbc:ID>
          </cac:PartyIdentification>
          <cac:PartyName>
            <cbc:Name><![CDATA[${razonSocial}]]></cbc:Name>
          </cac:PartyName>
        </cac:SignatoryParty>
        <cac:DigitalSignatureAttachment>
          <cac:ExternalReference>
            <cbc:URI>#signatureDIGITALPERU</cbc:URI>
          </cac:ExternalReference>
        </cac:DigitalSignatureAttachment>
      </cac:Signature>
    `;

    ublExtensions.parentNode.insertBefore(
      parser.parseFromString(cacSignatureXml, 'text/xml').documentElement,
      ublExtensions.nextSibling,
    );

    const preparedXml = new XMLSerializer().serializeToString(xmlDoc);

    // 5. Preparar firmador
    const sig = new SignedXml();
    sig.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
    sig.canonicalizationAlgorithm =
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
    (sig as any).prefix = 'ds';

    sig.addReference(
      '/*', // nodo raíz, en este caso <Invoice>
      ['http://www.w3.org/2000/09/xmldsig#enveloped-signature'],
      'http://www.w3.org/2000/09/xmldsig#sha1',
      '', // digestValue vacío
      '', // id vacío
      '',
      true, // fuerza URI vacío (no genera Id="_0")
    );

    sig.signingKey = normalizedKey.trim();
    (sig as any).keyInfoProvider = new CertKeyInfoProvider(certBase64);

    // 6. Firmar
    sig.computeSignature(preparedXml, {
      prefix: 'ds',
      location: {
        reference: "//*[local-name()='ExtensionContent']",
        action: 'append',
      },
      attrs: { Id: 'signatureDIGITALPERU' },
    });

    // 7. Resultado final
    return sig.getSignedXml();
  }
}
