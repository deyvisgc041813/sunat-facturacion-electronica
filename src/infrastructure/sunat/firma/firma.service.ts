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
    password: string
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

    // 4. Preparar XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');
    const preparedXml = new XMLSerializer().serializeToString(xmlDoc);

    // 5. Configurar firmador con SHA-256 y C14N exclusiva
    const sig = new SignedXml();
    sig.signatureAlgorithm =
      'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
    sig.canonicalizationAlgorithm = 'http://www.w3.org/2001/10/xml-exc-c14n#';
    (sig as any).prefix = 'ds';

    // 🔑 Referencia al documento completo con URI vacío (SUNAT lo exige)
    sig.addReference(
      "/*",
[
    "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
    "http://www.w3.org/2001/10/xml-exc-c14n#"
  ],
      'http://www.w3.org/2001/04/xmlenc#sha256',
      
      '',
      '',
      '',
      true, // fuerza a usar URI=""
    );
    sig.signingKey = normalizedKey.trim();
    (sig as any).keyInfoProvider = new CertKeyInfoProvider(certBase64);

    // 6. Firmar
    const xmlNormalized = preparedXml.replace(/\r\n/g, '\n');
    sig.computeSignature(xmlNormalized, {
      prefix: 'ds',
      location: {
        reference: "//*[local-name()='ExtensionContent']",
        action: 'append',
      },
      attrs: { Id: 'signatureFACTURALOPERU' }
    });

    // 7. Retornar XML firmado
    const signedXml =  sig.getSignedXml();
    return signedXml;
  }
}

