// generate-test-cert.js
import forge from 'node-forge';
import fs from 'fs';

export function generarCertificadoPrueba() {
  // 1. Generar clave RSA
  const keys = forge.pki.rsa.generateKeyPair(2048);

  // 2. Crear certificado autofirmado
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.privateKey = keys.privateKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [
    { name: 'countryName', value: 'PE' },
    { shortName: 'ST', value: 'Lima' },
    { name: 'localityName', value: 'Lima' },
    { name: 'organizationName', value: 'SUNAT' },
    { shortName: 'OU', value: 'Pruebas' },
    { name: 'commonName', value: '20000000001' }, // RUC de prueba
  ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  // 3. Crear PKCS#12 (PFX)
  const password = '123456'; // clave del PFX
  const newPkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(
    keys.privateKey,
    [cert],
    password,
    { algorithm: '3des' }
  );

  const pfxDer = forge.asn1.toDer(newPkcs12Asn1).getBytes();
  const pfxBuffer = Buffer.from(pfxDer, 'binary');

  // 4. Guardar a disco
  fs.writeFileSync('certificadoSunat.pfx', pfxBuffer);
  console.log('✅ Certificado de prueba generado: certificadoSunat.pfx');
  console.log('   Clave: 123456');
}

generarCertificadoPrueba();
