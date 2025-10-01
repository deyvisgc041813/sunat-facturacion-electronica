import { Injectable } from '@nestjs/common';
import { IPdfService } from 'src/domain/exportar/pdf/pdf.service';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import * as html_to_pdf from 'html-pdf-node';
import { IComprobantePdfDto } from 'src/domain/exportar/pdf.interface';

@Injectable()
export class PdfServiceImpl implements IPdfService {
  async generarComprobanteA4(datos: IComprobantePdfDto): Promise<Buffer> {
    // 1. Leer plantilla desde disco
    const templatePath = path.join(
      __dirname,
      'templates',
      '../../../resources/templates/pdf/comprobante.a4.hbs',
    );
    const htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // 2. Compilar con Handlebars
    const template = Handlebars.compile(htmlTemplate);
    const html = template(datos);

    // 3. Generar PDF con html-pdf-node
    const file = { content: html };
    const options = { format: 'A4', printBackground: true };
    const pdfBuffer = (await (html_to_pdf.generatePdf(
      file,
      options,
    ) as unknown)) as Buffer;

    // 4. Guardar en servidor (ej: carpeta /tmp o /pdfs)
    const outputDir = path.resolve(process.cwd(), 'pdfs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const outputPath = path.join(outputDir, `boleta-sssss.pdf`);
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log(`✅ PDF generado en: ${outputPath}`);

    return pdfBuffer;
  }
async  generarComprobanteTicket(datos: any): Promise<Buffer> {
        // 1. Leer plantilla desde disco
    const templatePath = path.join(
      __dirname,
      'templates',
      '../../../resources/templates/pdf/comprobante.ticket.hbs',
    );
    const htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // 2. Compilar con Handlebars
    const template = Handlebars.compile(htmlTemplate);
    const html = template(datos);

    // 3. Generar PDF con html-pdf-node
    const file = { content: html };
    // const options = { format: 'ticket', printBackground: true };
    const options = {
      width: '80mm',
      height: '200mm', // o el largo que necesites
      printBackground: true,
    };
    const pdfBuffer = (await (html_to_pdf.generatePdf(
      file,
      options,
    ) as unknown)) as Buffer;

    // 4. Guardar en servidor (ej: carpeta /tmp o /pdfs)
    const outputDir = path.resolve(process.cwd(), 'pdfs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const outputPath = path.join(outputDir, `boleta-sssss.pdf`);
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log(`✅ PDF generado en: ${outputPath}`);

    return pdfBuffer;
  }
}
