// convertir-pfx.ts
import forge from "node-forge";
import fs from "fs";

const pfxFile = "certificadoSunat.pfx"; // ya generado en el paso 1
const password = "123456"; // la misma clave que usaste al generar el PFX

// 1. Leer el PFX
const pfxBuffer = fs.readFileSync(pfxFile);
const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString("binary"));
const p12: any = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

// 2. Extraer clave privada
const keyBag = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
  forge.pki.oids.pkcs8ShroudedKeyBag
][0];
const privateKeyPem = forge.pki.privateKeyToPem(keyBag.key);

// 3. Extraer certificado
const certBag = p12.getBags({ bagType: forge.pki.oids.certBag })[
  forge.pki.oids.certBag
][0];
const certPem = forge.pki.certificateToPem(certBag.cert);

// 4. Guardar como PEM
fs.writeFileSync("key.pem", privateKeyPem);
fs.writeFileSync("cert.pem", certPem);

console.log("key.pem y cert.pem generados correctamente");
