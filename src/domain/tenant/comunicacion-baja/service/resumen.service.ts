// import { Injectable } from '@nestjs/common';
// import {
//   OperacionResumenEnum,
//   TipoComprobanteEnum,
// } from 'src/util/catalogo.enum';
// import {
//   extraerHashCpe,
//   getFechaHoraActualLima,
//   getFechaHoyYYYYMMDD,
//   mapSunatToEstado,
// } from 'src/util/Helpers';
// import { ErrorMapper } from 'src/domain/mapper/error-exception.mapper';
// import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
// import { CreateSunatLogDto } from 'src/domain/tenant/sunat-log/interface/sunat.log.interface';
// import {
//   codigoRespuestaSunatMap,
//   EstadoComunicacionEnvioSunat,
//   EstadoEnumComprobante,
//   EstadoEnvioSunat,
// } from 'src/util/estado.enum';
// import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/auditoria/sunat-log.repository.impl';
// import { CryptoUtil } from 'src/util/CryptoUtil';
// import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
// import { ZipUtil } from 'src/util/ZipUtil';
// import { XmlBuilderResumenService } from 'src/infrastructure/sunat/xml/xml-builder-resumen.service';
// import { SerieComprobanteRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/serie-comprobante.repository.impl';
// import { ComprobanteRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/comprobante/comprobante.repository.impl';
// import {
//   IDocumento,
//   ISummaryDocument,
// } from '../interface/sunat.summary.interface';
// import { CreateResumenBoletaDto } from '../interface/create.summary.interface';
// import { ResumenRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/resumen.repository';
// import { ResumenBoletaDetalleDto } from '../interface/create.summary.detalle.interface';
// import { GetCertificadoDto } from 'src/domain/parent/empresa/dto/obtner-certificado.dto';
// import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
// import { ResumenResponseDto } from '../dto/resumen.response.dto';
// import { BusinessLogicException } from 'src/adapter/web/exception/exeception-dynamic';
// import { IResponseSunat } from '../../comprobante/interface/response.sunat.interface';
// import { SummaryDocumentDto } from '../dto/summary-document.dto';
// import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
// import { SucursalService } from 'src/domain/parent/sucursal/service/sucursal.service';
// export interface ISunatPayloadData {
//   signedXml: string;
//   fileName: string;
//   zipBuffer: Buffer;
//   hash: string;
// }
// export interface IResumenIdentificadorResponse {
//   /** Identificador único del resumen diario (por ejemplo: B001-20251018-00123). */
//   resumenId: string;
//   correlativo: number;
//   serieId: number;
// }
// const estadosFinales = new Set([
//   EstadoEnvioSunat.ACEPTADO,
//   EstadoEnvioSunat.RECHAZADO,
//   EstadoEnvioSunat.ERROR,
// ]);
// @Injectable()
// export class ComunicacionBajaService {
//   constructor(
//     private readonly comprobanteRepo: ComprobanteRepositoryImpl,
//     private readonly resumenRepo: ResumenRepositoryImpl,
//     protected readonly sunatLogRepo: SunatLogRepositoryImpl,
//     protected readonly firmaService: FirmaService,
//     private readonly serieRepo: SerieComprobanteRepositoryImpl,
//     private readonly xmlBuilderResumenBpService: XmlBuilderResumenService,
//     private readonly sunatService: SunatService,
//     protected readonly sucursalService: SucursalService,
//   ) {}

//   async iniciarProceso(
//     data: SummaryDocumentDto,
//     auth: IUserPayload,
//   ): Promise<{
//     status: boolean;
//     message: string;
//     xmlFirmado: string;
//     ticket: string;
//   }> {
//     const empresaId = auth?.empresaId ?? 0;
//     const sucursalId = auth.sucursalActiva ?? 0;
//     const sucursal = await this.sucursalService.getDigitalCertificate(
//       sucursalId,
//       empresaId,
//     );
//     const tenantDatabase = auth.subDominio;
//     const fechas = this.obtenerFechasResumen();
//     // 1. Obtener correlativo y boletas
//     const resumen = await this.obtenerResumenId(
//       sucursalId,
//       fechas.fechaEnvioResumen,
//       data.serieResumen,
//       tenantDatabase,
//     );

//     const boletas = await this.obtenerBoletasPendientes(
//       sucursalId,
//       data.serie ?? 'B001',
//       data.fecReferencia,
//       tenantDatabase,
//     );
//     if (!boletas.length) {
//       return {
//         status: false,
//         message: 'No existen boletas pendientes para enviar en el resumen.',
//         xmlFirmado: '',
//         ticket: '',
//       };
//     }

//     // 2. Mapear documentos y armar resumen
//     const documentos = this.mapearDocumentos(boletas);
//     const objectSummary: ISummaryDocument = {
//       ublVersion: data.ublVersion,
//       customizationID: data.customizationID,
//       resumenId: resumen.resumenId,
//       fechaEnvio: fechas.fechaEnvio,
//       fecReferencia: new Date(data.fecReferencia),
//       company: data.company,
//       documentos,
//       signatureId: sucursal?.signatureId ?? '',
//       signatureNote: sucursal?.signatureNote ?? '',
//     };
//     const builResumen = await this.buildSunatSubmissionPayload(
//       objectSummary,
//       sucursal.certificadoDigital,
//       sucursal.claveCertificado,
//       fechas.fechaEnvioResumen,
//       resumen.correlativo,
//       data.serieResumen,
//     );
//     const detalle: ResumenBoletaDetalleDto[] = objectSummary.documentos.map(
//       (bol: IDocumento) => ({
//         comprobanteId: bol.comprobanteId,
//         operacion: OperacionResumenEnum.ADICIONAR,
//       }),
//     );
//     const resumenSave = await this.createResumen(
//       sucursalId,
//       resumen.correlativo,
//       fechas.fechaEnvio,
//       objectSummary.fecReferencia,
//       builResumen?.fileName,
//       builResumen?.signedXml,
//       builResumen?.hash,
//       resumen?.resumenId,
//       detalle,
//       tenantDatabase
//     );
//     await this.setNextCorrelativo(
//       sucursalId,
//       resumen?.serieId,
//       resumen?.correlativo,
//       tenantDatabase
//     );
//     const rpta = this.submitResumenSunat(
//       sucursalId,
//       sucursal,
//       builResumen,
//       resumen,
//       detalle,
//       resumenSave.data ?? 0,
//       data.serie ?? '',
//       tenantDatabase
//     );
//     return rpta;
//   }

//   async buildSunatSubmissionPayload(
//     objectSummary: ISummaryDocument,
//     certificadoDigital: any,
//     claveCertificado: string,
//     fechaEnvioResumen: string,
//     correlativo: number,
//     serieResumen: string,
//   ): Promise<ISunatPayloadData> {
//     // 3. Firmar XML
//     const xml =
//       this.xmlBuilderResumenBpService.buildResumenBoletas(objectSummary);
//     const passwordDecript = CryptoUtil.decrypt(claveCertificado);
//     const xmlFirmado = await this.firmaService.firmarXml(
//       xml,
//       certificadoDigital,
//       passwordDecript,
//     );
//     // 4. Comprimir ZIP
//     const fileName = this.obtenerNombreFile(
//       objectSummary.company.ruc,
//       fechaEnvioResumen,
//       correlativo,
//       serieResumen,
//     );
//     const zipBuffer = await ZipUtil.createZip(fileName, xmlFirmado);
//     const hash = (await extraerHashCpe(xmlFirmado)) ?? '';
//     return { signedXml: xmlFirmado, fileName, zipBuffer, hash };
//   }
//   obtenerFechasResumen(): { fechaEnvio: Date; fechaEnvioResumen: string } {
//     return {
//       fechaEnvio: getFechaHoraActualLima(),
//       fechaEnvioResumen: getFechaHoyYYYYMMDD(),
//     };
//   }
//   async obtenerResumenId(
//     sucursalId: number,
//     fecResumen: string,
//     serie: string,
//     tenantDatabase?: string,
//   ): Promise<IResumenIdentificadorResponse> {
//     const rsp = await this.serieRepo.getNextCorrelativo(
//       sucursalId,
//       TipoComprobanteEnum.RESUMEN_DIARIO,
//       serie,
//       tenantDatabase,
//     );
//     return {
//       resumenId: `${serie}-${fecResumen}-${rsp.correlativo}`,
//       correlativo: rsp.correlativo,
//       serieId: rsp.serieId,
//     };
//   }
//   async obtenerBoletasPendientes(
//     sucursalId: number,
//     serie: string,
//     fechaReferencia: string,
//     tenantDatabase?: string,
//   ) {
//     const rspSerie = await this.serieRepo.findBySucursalTipCompSerie(
//       sucursalId,
//       TipoComprobanteEnum.BOLETA,
//       serie,
//       tenantDatabase,
//     );
//     const serieId = rspSerie?.serieId ?? 0;

//     return this.comprobanteRepo.findBoletasForResumen(
//       sucursalId,
//       serieId,
//       fechaReferencia,
//       [EstadoEnumComprobante.PENDIENTE, EstadoEnumComprobante.ANULADO],
//       tenantDatabase
//     );
//   }
//   async procesarErrorResumen(
//     error: any,
//     resumendIdBd: number,
//     sucursalId: number,
//     resumenId: string,
//     xmlFirmado: string,
//     serie: string,
//     tenantDatabase?:string
//   ) {
//     const rspError = ErrorMapper.mapError(error, {
//       sucursalId,
//       tipo: serie, // Resumen
//       serie: resumenId,
//     });
//     if (rspError?.tipoError === OrigenErrorEnum.SUNAT) {
//       const obj = rspError?.create as CreateSunatLogDto;
//       obj.resumenId = resumendIdBd;
//       obj.request = xmlFirmado;
//       obj.serie = resumenId;
//       obj.sucursalId = sucursalId;
//       ((obj.intentos = 0), // esto cambiar cuando este ok
//         (obj.usuarioEnvio = 'DEYVISGC')); // esto cambiar cuando este ok
//       obj.fechaRespuesta = new Date();
//       obj.fechaEnvio = new Date();
//       await this.sunatLogRepo.save(obj, tenantDatabase);
//     }
//   }
//   mapearDocumentos(boletas: any[]): IDocumento[] {
//     return boletas.map((b, index) => {
//       const totalGravado = Number(b.totalGravado ?? 0);
//       const totalExonerado = Number(b.totalExonerado ?? 0);
//       const totalInafecto = Number(b.totalInafecto ?? 0);
//       const icbper = Number(b.icbper ?? 0);
//       const igv = Number((totalGravado * 0.18).toFixed(2));
//       const total = Number(
//         (totalGravado + totalExonerado + totalInafecto + igv + icbper).toFixed(
//           2,
//         ),
//       );
//       return {
//         linea: index + 1,
//         tipoDoc: b.serie?.tipoComprobante ?? '03',
//         serieNumero: `${b.serie?.serie}-${b.numeroComprobante}`,
//         tipoMoneda: b.moneda,
//         cliente: {
//           tipoDoc: b.cliente?.tipoDocumento || '0',
//           numDoc: b.cliente?.numeroDocumento || '99999999',
//         },
//         estado: b.estado,
//         total,
//         pagos: [
//           { monto: totalGravado + totalExonerado + totalInafecto, tipo: '01' },
//         ],
//         igv,
//         icbper,
//         mtoOperGravadas: totalGravado,
//         mtoOperExoneradas: totalExonerado,
//         mtoOperInafectas: totalInafecto,
//         mtoOperExportacion: 0,
//         comprobanteId: b.comprobanteId,
//       };
//     });
//   }

//   private obtenerNombreFile(
//     ruc: string,
//     fecReferencia: string,
//     correlativo: number,
//     serie: string,
//   ) {
//     return `${ruc}-${serie}-${fecReferencia}-${correlativo}`;
//   }
//   async createResumen(
//     sucursalId: number,
//     correlativo: number,
//     fechaEnvio: Date,
//     fecReferencia: Date,
//     fileName: string,
//     xmlFirmado: string,
//     hash: string,
//     resumenId: string,
//     detalle: ResumenBoletaDetalleDto[],
//     tenantDatabase?: string,
//   ) {
//     const resumenEntity: CreateResumenBoletaDto = {
//       sucursalId,
//       correlativo,
//       estado: EstadoEnvioSunat.PENDIENTE,
//       fechaGeneracion: new Date(fechaEnvio),
//       fecReferencia: new Date(fecReferencia),
//       nombreArchivo: fileName,
//       xml: xmlFirmado,
//       hashResumen: hash,
//       ticket: '',
//       resumenId: resumenId,
//       detalle,
//     };

//     const savedResumen = await this.resumenRepo.save(
//       resumenEntity,
//       tenantDatabase,
//     );
//     return savedResumen;
//   }

//   async setNextCorrelativo(
//     sucursalId: number,
//     serieId: number,
//     newCorrelativo: number,
//     tenantDatabase?:string
//   ) {
//     await this.serieRepo.setNextCorrelativo(
//       sucursalId,
//       serieId,
//       newCorrelativo,
//       tenantDatabase
//     );
//   }
//   async submitResumenSunat(
//     sucursalId: number,
//     sucursal: GetCertificadoDto,
//     sunatPayloadData: ISunatPayloadData,
//     identificadorResumen: IResumenIdentificadorResponse,
//     detalle: ResumenBoletaDetalleDto[],
//     resumenIdBd: number,
//     serie: string,
//     tenantDatabase?:string
//   ) {
//     try {
//       const usuarioSecundario = sucursal?.usuarioSolSecundario ?? '';
//       const claveSecundaria = CryptoUtil.decrypt(
//         sucursal.claveSolSecundario ?? '',
//       );
//       const ticket = await this.sunatService.sendSummary(
//         `${sunatPayloadData.fileName}.zip`,
//         sunatPayloadData.zipBuffer,
//         usuarioSecundario,
//         claveSecundaria,
//       );

//       // 7. Actualizar resumen a ENVIADO
//       await this.resumenRepo.update(
//         identificadorResumen?.resumenId,
//         sucursalId,
//         {
//           estado: EstadoEnvioSunat.ENVIADO,
//           ticket,
//         },
//         tenantDatabase
//       );

//       // 8. Actualizar boletas
//       const boletasIds = detalle.map((d) => d.comprobanteId);
//       await this.updateBoletaStatus(sucursalId, boletasIds, tenantDatabase);
//       return {
//         status: true,
//         message: `Resumen diario enviado correctamente. Ticket: ${ticket}`,
//         xmlFirmado: sunatPayloadData.signedXml,
//         ticket,
//       };
//     } catch (error: any) {
//       // 9. Actualizar resumen con error
//       await this.resumenRepo.update(
//         identificadorResumen.resumenId,
//         sucursalId,
//         {
//           estado: EstadoEnvioSunat.ERROR,
//         },
//         tenantDatabase
//       );
//       await this.procesarErrorResumen(
//         error,
//         resumenIdBd,
//         sucursalId,
//         identificadorResumen.resumenId, // resumen serie envio a sunat
//         sunatPayloadData.signedXml,
//         serie,
//       );
//       throw error;
//     }
//   }
//   async updateBoletaStatus(sucursalId: number, boletasIds: number[], tenantDatabase?:string) {
//     await this.comprobanteRepo.updateBoletaStatus(
//       sucursalId,
//       boletasIds,
//       EstadoEnumComprobante.ENVIADO,
//       EstadoComunicacionEnvioSunat.ENVIADO,
//       tenantDatabase
//     );
//   }
//   async validarEstadoFinalResumen(resumen: ResumenResponseDto | null) {
//     const estado = codigoRespuestaSunatMap[resumen?.codigoRespuestaSunat ?? ''];

//     if (estadosFinales.has(estado)) {
//       throw new BusinessLogicException(
//         `El resumen ya fue procesado por SUNAT y se encuentra en estado definitivo (${estado}). ` +
//           `No es posible volver a enviarlo ni consultarlo nuevamente.`,
//       );
//     }
//   }
//   async consultarEstadoTicketSunat(
//     ticket: string,
//     usuarioSecundario: string,
//     claveSecundaria: string
//   ) {
//     try {
//       const result = await this.sunatService.getStatus(
//         ticket,
//         usuarioSecundario,
//         claveSecundaria,
//       );
//       return result;
//     } catch (error) {
//       throw error;
//     }
//   }
//   async updateBySucursalAndTicket(
//     sucursalId: number,
//     ticket: string,
//     result: IResponseSunat,
//     tenantDatabase?:string
//   ) {
//     await this.resumenRepo.updateBySucursalAndTicket(sucursalId, ticket, {
//       estado: mapSunatToEstado(result.codigoResponse ?? ''),
//       codResPuestaSunat: result.codigoResponse ?? '',
//       cdr: result.cdr?.toString('base64') ?? null,
//       mensajeSunat: result.mensaje,
//       observacionSunat:
//         result.observaciones.length > 0
//           ? JSON.stringify(result.observaciones)
//           : null,
//       fechaRespuestaSunat: new Date(),
//     }, tenantDatabase);
//   }
//   async findBySucursalAndTicket(
//     sucursalId: number,
//     ticket: string,
//     tenantDatabase?:string
//   ): Promise<ResumenResponseDto | null> {
//     const resumen = await this.resumenRepo.findBySucursalAndTicket(
//       sucursalId,
//       ticket,
//       tenantDatabase
//     );
//     if (!resumen) {
//       throw new BusinessLogicException(
//         `No existe un resumen registrado con el ticket ${ticket}. Verifique que el número de ticket proporcionado sea correcto.`,
//       );
//     }
//     return resumen;
//   }
// }
