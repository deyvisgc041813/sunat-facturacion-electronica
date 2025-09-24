import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { ZipUtil } from 'src/util/ZipUtil';
import { CryptoUtil } from 'src/util/CryptoUtil';
import { SummaryDocumentDto } from 'src/domain/resumen/dto/SummaryDocumentDto';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { EmpresaRepository } from 'src/domain/empresa/Empresa.repository';
import { SunatLogRepository } from 'src/domain/sunat-log/SunatLog.repository';
import { XmlBuilderResumenService } from 'src/infrastructure/sunat/xml/xml-builder-resumen.service';
import { IResumenRepository } from 'src/domain/resumen/interface/resumen.repository.interface';
import { ConprobanteRepository } from 'src/domain/comprobante/comprobante.repository';
import { SerieRepository } from 'src/domain/series/Serie.repository';
import {
  OperacionResumenEnum,
  TipoComprobanteEnum,
} from 'src/util/catalogo.enum';
import {
  IDocumento,
  ISummaryDocument,
} from 'src/domain/resumen/interface/sunat.summary.interface';
import {
  extraerHashCpe,
  getFechaHoraActualLima,
  getFechaHoyYYYYMMDD,
} from 'src/util/Helpers';
import { CreateResumenBoletaDto } from 'src/domain/resumen/interface/create.summary.interface';
import { EstadoComunicacionEnvioSunat, EstadoEnumComprobante, EstadoEnvioSunat } from 'src/util/estado.enum';
import { ResumenBoletaDetalleDto } from 'src/domain/resumen/interface/create.summary.detalle.interface';
import { ErrorMapper } from 'src/domain/mapper/ErrorMapper';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
import { CreateSunatLogDto } from 'src/domain/sunat-log/interface/sunat.log.interface';

export class CreateResumenUseCase {
  constructor(
    private readonly xmlBuilderResumenBpService: XmlBuilderResumenService,
    private readonly firmaService: FirmaService,
    private readonly sunatService: SunatService,
    private readonly empresaRepo: EmpresaRepository,
    protected readonly sunatLogRepo: SunatLogRepository,
    private readonly resumenRepo: IResumenRepository,
    private readonly comprobanteRepo: ConprobanteRepository,
    private readonly serieRepo: SerieRepository,
  ) {}

  async execute(data: SummaryDocumentDto): Promise<{
    status: boolean;
    message: string;
    xmlFirmado: string;
    ticket: string;
  }> {
    const respCert = await this.empresaRepo.findCertificado(
      data?.company?.ruc.trim(),
    );

    if (!respCert?.certificadoDigital || !respCert?.claveCertificado) {
      throw new Error(
        `No se encontró certificado o clave para la empresa con RUC ${data.company.ruc}`,
      );
    }

    const empresaId = respCert.empresaId ?? 0;
    const fechaEnvio: Date = getFechaHoraActualLima();
    const fechaEnvioResumen = getFechaHoyYYYYMMDD();
    // 1. Obtener correlativo y boletas
    const resumen = await this.obtenerResumenId(empresaId, fechaEnvioResumen, data.serieResumen);

    const boletas = await this.obtenerBoletasPendientes(
      empresaId,
      data.serie ?? 'B001',
      data.fecReferencia,
    );

    if (!boletas.length) {
      return {
        status: false,
        message: 'No existen boletas pendientes para enviar en el resumen.',
        xmlFirmado: '',
        ticket: '',
      };
    }

    // 2. Mapear documentos y armar resumen
    const documentos = this.mapearDocumentos(boletas);
    const objectSummary: ISummaryDocument = {
      ublVersion: data.ublVersion,
      customizationID: data.customizationID,
      resumenId: resumen.resumenId,
      fechaEnvio,
      fecReferencia: new Date(data.fecReferencia),
      company: data.company,
      documentos,
    };

    // 3. Firmar XML
    const xml =
      this.xmlBuilderResumenBpService.buildResumenBoletas(objectSummary);
    const passwordDecript = CryptoUtil.decrypt(respCert.claveCertificado);
    const xmlFirmado = await this.firmaService.firmarXml(
      xml,
      respCert.certificadoDigital,
      passwordDecript,
    );

    // 4. Comprimir ZIP
    const fileName = this.obtenerNombreFile(
      objectSummary.company.ruc,
      fechaEnvioResumen,
      resumen.correlativo,
      data.serieResumen
    );
    const zipBuffer = await ZipUtil.createZip(fileName, xmlFirmado);

    // 5. Guardar preliminarmente el resumen en BD (estado EN_PROCESO)
    const hash = (await extraerHashCpe(xmlFirmado)) ?? '';
    const detalle: ResumenBoletaDetalleDto[] = objectSummary.documentos.map(
      (bol: IDocumento) => ({
        comprobanteId: bol.comprobanteId,
        operacion: OperacionResumenEnum.ADICIONAR,
      }),
    );
    const resumenEntity: CreateResumenBoletaDto = {
      empresaId,
      correlativo: resumen.correlativo,
      estado: EstadoEnvioSunat.PENDIENTE,
      fechaGeneracion: new Date(fechaEnvio),
      fecReferencia: new Date(objectSummary.fecReferencia),
      nombreArchivo: fileName,
      xml: xmlFirmado,
      hashResumen: hash,
      ticket: '', // aún no lo tenemos
      resumenId: resumen?.resumenId,
      detalle,
    };
    const resumenBd = await this.resumenRepo.save(resumenEntity);
    await this.serieRepo.actualizarCorrelativo(resumen?.serieId, resumen?.correlativo)
    try {
      // 6. Enviar a SUNAT
      const ticket = await this.sunatService.sendSummary(
        `${fileName}.zip`,
        zipBuffer,
      );

      // 7. Actualizar resumen a ENVIADO
      await this.resumenRepo.update(resumen?.resumenId, empresaId, {
        estado: EstadoEnvioSunat.ENVIADO,
        ticket,
      });

      // 8. Actualizar boletas
      const boletasIds = detalle.map((d) => d.comprobanteId);
      await this.comprobanteRepo.updateBoletaStatus(
        empresaId,
        boletasIds,
        EstadoEnumComprobante.ENVIADO,
        EstadoComunicacionEnvioSunat.ENVIADO,
      );
      return {
        status: true,
        message: `Resumen diario enviado correctamente. Ticket: ${ticket}`,
        xmlFirmado,
        ticket,
      };
    } catch (error: any) {
      // 9. Actualizar resumen con error
      await this.resumenRepo.update(resumen.resumenId, empresaId, {
        estado: EstadoEnvioSunat.ERROR,
      });
      await this.procesarErrorResumen(
        error,
        resumenBd.data ?? 0,
        empresaId,
        resumen.resumenId,
        xmlFirmado,
        data.serie ?? ""
      );
      //await this.logErrorSunat(error, empresaId);
      throw error;
    }
  }

  // 🔹 Helpers privados

  private async obtenerBoletasPendientes(
    empresaId: number,
    serie: string,
    fechaReferencia: string,
  ) {
    const rspSerie = await this.serieRepo.findByEmpresaAndTipCompAndSerie(
      empresaId,
      TipoComprobanteEnum.BOLETA,
      serie,
    );
    const serieId = rspSerie?.serieId ?? 0;

    return this.comprobanteRepo.findBoletasForResumen(
      empresaId,
      serieId,
      fechaReferencia,
      [EstadoEnumComprobante.PENDIENTE, EstadoEnumComprobante.ANULADO],
    );
  }

  private mapearDocumentos(boletas: any[]): IDocumento[] {
    return boletas.map((b, index) => {
      const totalGravado = Number(b.totalGravado ?? 0);
      const totalExonerado = Number(b.totalExonerado ?? 0);
      const totalInafecto = Number(b.totalInafecto ?? 0);
      const icbper = Number(b.icbper ?? 0);
      const igv = Number((totalGravado * 0.18).toFixed(2));
      const total = Number(
        (totalGravado + totalExonerado + totalInafecto + igv + icbper).toFixed(
          2,
        ),
      );
      return {
        linea: index + 1,
        tipoDoc: b.serie?.tipoComprobante ?? '03',
        serieNumero: `${b.serie?.serie}-${b.numeroComprobante}`,
        tipoMoneda: b.moneda,
        cliente: {
          tipoDoc: b.cliente?.tipoDocumento || '0',
          numDoc: b.cliente?.numeroDocumento || '99999999',
        },
        estado: b.estado,
        total,
        pagos: [
          { monto: totalGravado + totalExonerado + totalInafecto, tipo: '01' },
        ],
        igv,
        icbper,
        mtoOperGravadas: totalGravado,
        mtoOperExoneradas: totalExonerado,
        mtoOperInafectas: totalInafecto,
        mtoOperExportacion: 0,
        comprobanteId: b.comprobanteId,
      };
    });
  }

  private obtenerNombreFile(
    ruc: string,
    fecReferencia: string,
    correlativo: number,
    serie:string
  ) {
    return `${ruc}-${serie}-${fecReferencia}-${correlativo}`;
  }

  private async obtenerResumenId(
    empresaId: number,
    fecResumen: string,
    serie:string,
  ): Promise<{resumenId: string, correlativo:number, serieId:number}> {
    const rsp = await this.serieRepo.getNextCorrelativo(empresaId, TipoComprobanteEnum.RESUMEN_DIARIO, serie);
    return {
      resumenId: `${serie}-${fecResumen}-${rsp.correlativo}`,
      correlativo: rsp.correlativo,
      serieId: rsp.serieId
    };
  }
  private async procesarErrorResumen(
    error: any,
    resumendIdBd: number,
    empresaId: number,
    resumenId: string,
    xmlFirmado: string,
    serie:string,
  ) {
    const rspError = ErrorMapper.mapError(error, {
      empresaId,
      tipo: serie, // Resumen
      serie: resumenId,
    });

    if (rspError.tipoError === OrigenErrorEnum.SUNAT) {
      const obj = rspError.create as CreateSunatLogDto;
      obj.resumenId = resumendIdBd;
      obj.request = xmlFirmado;
      obj.empresaId = empresaId;
      obj.serie = resumenId;
      await this.sunatLogRepo.save(obj);
    }
  }
}
