import { EmpresaRepository } from 'src/domain/empresa/Empresa.repository';
import { ConprobanteRepository } from 'src/domain/comprobante/comprobante.repository';
import { IPdfService } from 'src/domain/exportar/pdf/pdf.service';
import { BadRequestException } from '@nestjs/common';
import QRCode from 'qrcode';

import {
  IComprobantePdfDto,
  ItemComprobante,
} from 'src/domain/exportar/pdf.interface';
import { DetailDto } from 'src/domain/comprobante/dto/base/DetailDto';
import { formatDateForSunat, formatDateToDDMMYYYY } from 'src/util/Helpers';
import { convertirMontoEnLetras } from 'src/util/conversion-numero-letra';
import { ComprobanteResponseDto } from 'src/domain/comprobante/dto/ConprobanteResponseDto';
import { TipoComprobanteEnum } from 'src/util/catalogo.enum';
export class CreatePdfUseCase {
  constructor(
    private readonly empresaRepo: EmpresaRepository,
    private readonly comprobanteRepo: ConprobanteRepository,
    private readonly pdfService: IPdfService,
  ) {}
  async execute(empresaId: number, comprobanteId: number): Promise<any> {
    try {
      const empresa = await this.empresaRepo.findById(empresaId, false);
      if (!empresa) {
        throw new BadRequestException(
          'No se encontró información de la empresa asociada al usuario actual. No es posible generar el comprobante.',
        );
      }
      const comprobante = await this.comprobanteRepo.findByEmpresaAndId(
        empresaId,
        [comprobanteId],
      );
      if (!comprobante || comprobante.length === 0) {
        throw new BadRequestException(
          `No se encontró información del comprobante con ID ${comprobanteId} para la empresa ${empresaId}.`,
        );
      }
      const dataComprobante = comprobante[0];
      const itemDetalle: ItemComprobante[] =
        comprobante[0].payloadJson?.details?.map((com: DetailDto) => {
          const cantidad = Number(com.cantidad) || 0;
          const pUnit = Number(com.mtoPrecioUnitario) || 0;
          const descuento = Number(com.mtoDescuento) || 0;
          return {
            cantidad,
            unidad: com.unidad,
            descripcion: com.descripcion,
            pUnit: pUnit.toFixed(2),
            descuento: descuento.toFixed(2),
            total: (cantidad * pUnit).toFixed(2),
          };
        }) ?? [];

      const qr = await this.generarQRBoleta(
        empresa?.ruc,
        dataComprobante,
        dataComprobante?.payloadJson,
      );
      const tipoComprobante = dataComprobante?.payloadJson?.tipoComprobante ?? '';
      const numDocCliente = dataComprobante?.payloadJson?.client?.numDoc ?? '';
      const clientePayloadJson =
        dataComprobante?.payloadJson?.client?.rznSocial ?? '';
      const tipoDocumentoCliente =
        dataComprobante?.payloadJson?.client?.tipoDoc ?? '';
      const direccionCliente =
        dataComprobante?.payloadJson?.client?.address?.direccion ?? '';
      const telefonoCliente =
        dataComprobante?.payloadJson?.client?.telefono ?? '';
      const formaPago = dataComprobante?.payloadJson?.formaPago?.tipo ?? '';
      const TipoDocumentoLabels: Record<string, string> = {
        '0': 'DOC. TRIB. NO DOM. SIN RUC',
        '1': 'DNI',
        '4': 'CARNET DE EXTRANJERÍA',
        '6': 'RUC',
        '7': 'PASAPORTE',
        A: 'CÉDULA DIPLOMÁTICA',
      };
      const data: IComprobantePdfDto = {
        logo:
          empresa.logo ??
          'https://i.pinimg.com/originals/67/41/47/674147e7652f6388add8b9913639c6a7.png',
        empresa: empresa?.razonSocial,
        rucEmpresa: empresa.ruc,
        direccionEmpresa: empresa?.direccion ?? '',
        telefonoEmpresa: empresa?.telefono,
        emailEmpresa: empresa?.email,
        cliente: clientePayloadJson,
        numeroDocumento: numDocCliente,
        tipoDocLabel: TipoDocumentoLabels[tipoDocumentoCliente] || 'N/A',
        direccionCliente: direccionCliente,
        telefonoCliente,
        serie: dataComprobante?.serieCorrelativo,
        fechaEmision: formatDateForSunat(dataComprobante?.fechaEmision),
        fechaVencimiento: formatDateForSunat(dataComprobante?.fechaVencimiento),
        opGravadas: String(dataComprobante?.totalGravado),
        opExoneradas: String(dataComprobante?.totalExonerado),
        opInafectas: String(dataComprobante?.totalInafecto),
        igv: String(dataComprobante?.totalIgv),
        total: String(dataComprobante?.total),
        montoLetras: convertirMontoEnLetras(Number(dataComprobante?.total)),
        qrPath: qr ?? '',
        hash: dataComprobante?.hashCpe ?? '',
        condicionPago: formaPago,
        medioPago: 'Efectivo',
        vendedor: '',
        urlConsulta: 'https://rdinversiones.easyfacturasegdt.com/buscar',
        items: itemDetalle,
        titleComprobante: this.setTitleComprobante(tipoComprobante) ?? ""
      };
      
      return this.pdfService.generarBoleta(data);
    } catch (err) {
      throw err;
    }
  }
  async generarQRBoleta(
    numRuc: string,
    dataComprobante: ComprobanteResponseDto,
    payloadJson: any,
  ): Promise<string | undefined> {
    const tipoComprobante = payloadJson?.tipoComprobante ?? '';
    const serie = payloadJson?.serie ?? '';
    const tipoDoc = payloadJson.client?.tipoDoc ?? '';
    const numeroDocumento = payloadJson.client?.numDoc ?? '';
    const qrData = [
      numRuc, // RUC emisor
      tipoComprobante, // Tipo comprobante (01=factura, 03=boleta)
      serie, // Serie
      dataComprobante.numeroComprobante, // Correlativo
      dataComprobante?.totalIgv, // IGV total
      dataComprobante?.total, // Importe total
      formatDateToDDMMYYYY(dataComprobante.fechaEmision), // Fecha de emisión
      tipoDoc, // Tipo doc cliente (1=DNI, 6=RUC)
      numeroDocumento, // Número doc cliente
    ].join('|');
    try {
      const qr = await QRCode.toDataURL(qrData, { width: 250 });
      return qr;
    } catch (err) {
      console.error('Error generando QR:', err);
    }
  }
private setTitleComprobante(tipoComprobante: string): string {
  let message = "";
  
  if (TipoComprobanteEnum.BOLETA === tipoComprobante) {
    message = "BOLETA DE VENTA";
  } else if (TipoComprobanteEnum.FACTURA === tipoComprobante) {
    message = "FACTURA DE VENTA";
  } else if (TipoComprobanteEnum.NOTA_CREDITO === tipoComprobante) {
    message = "NOTA DE CRÉDITO";
  } else if (TipoComprobanteEnum.NOTA_DEBITO === tipoComprobante) {
    message = "NOTA DE DÉBITO";
  }
  return message
}

}
