import JSZip from 'jszip';


export class ZipUtil {
  static async createZip(fileName: string, xml: string): Promise<Buffer> {
    const zip = new JSZip();
    const fileNameXml = `${fileName}.xml`;

    // Asegurar que el XML esté en UTF-8 sin BOM
    const xmlUtf8 = Buffer.from(xml, 'utf8');
    

    zip.file(fileNameXml, xmlUtf8);

    return await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });
  }
}
