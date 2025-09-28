import { EstadoComunicacionEnvioSunat, EstadoEnumComprobante } from 'src/util/estado.enum';
import { ComprobanteResponseDto } from './dto/ConprobanteResponseDto';
import { IUpdateComprobante } from './interface/update.interface';
export interface ArchivoDescargable {
  fileName: string; // Nombre sugerido del archivo (ej: 20600887735-01-F001-123.xml)
  mimeType: string; // application/xml, application/zip, etc.
  content: Buffer; // Contenido binario para descarga (puedes convertirlo a Base64 si es para JSON)
}

export interface ConprobanteRepository {
  /**
   * Retorna todos los comprobantes registrados.
   */
  findAll(sucursalId: number): Promise<ComprobanteResponseDto[]>;

  /**
   * Busca un comprobante por su ID.
   */

  findById(
    sucursalId: number,
    comprobanteIds: number[],
  ): Promise<ComprobanteResponseDto[] | null>;

  // 📄 XML firmado
  getXmlFirmado(
    comprobanteId: number,
    sucursalId: number,
  ): Promise<ArchivoDescargable | null>;

  // 📦 ZIP enviado a SUNAT
  getZipEnviado(
    comprobanteId: number,
    sucursalId: number,
  ): Promise<ArchivoDescargable | null>;

  // 📩 ZIP CDR de SUNAT
  getCdrZip(
    comprobanteId: number,
    sucursalId: number,
  ): Promise<ArchivoDescargable | null>;

  // 🔑 Hash del comprobante
  getHashCpe(comprobanteId: number, sucursalId: number): Promise<string | null>;

  /**
   * Retorna el hash del comprobante (firmado).
   */
  getHashCpe(comprobanteId: number, sucursalId: number): Promise<string | null>;

  // 🔄 Un solo método de actualización flexible
  update(
    comprobanteId: number,
    sucursalId: number,
    update: IUpdateComprobante,
  ): Promise<{ status: boolean; message: string }>;

  /**
   * Lista los comprobantes por estado (ej: todos los pendientes, todos los rechazados).
   */
  findByEstado(
    estado: EstadoEnumComprobante,
    sucursalId: number,
  ): Promise<ComprobanteResponseDto[]>;

  /**
   * Obtiene todos los comprobantes de una sucursal en un rango de fechas.
   */
  findBySucursalAndFecha(
    sucursalId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<ComprobanteResponseDto[]>;
  findByComprobanteAceptado(
    sucursalId: number,
    serieId: number,
    numCorrelativo: number,
  ): Promise<ComprobanteResponseDto | null>;
  /**
   * Actualizar el estado de un comprobante (ej: comunicación de baja).
   */
  updateComprobanteStatus(
    sucursalId: number,
    serieId: number,
    numCorrelativo: number,
    desEstado: string,
    estado: EstadoEnumComprobante,
  ): Promise<boolean>;
  updateComprobanteStatusMultiple(
    sucursalId: number,
    comprobanteIds: number[],
    nuevoEstado: EstadoEnumComprobante,
    comunicadoSunat: EstadoComunicacionEnvioSunat
  );
  updateBoletaStatus(
    sucursalId: number,
    boletasIds: number[],
    nuevoEstado: EstadoEnumComprobante,
    comunicadoSunat: EstadoComunicacionEnvioSunat,
  );
  findComprobanteByReferencia(
    sucursalId: number,
    tipoComprobante: string,
    motivos: string[],
    estado: string,
    serieRef: string,
    correlativoRef: number,
  ): Promise<ComprobanteResponseDto | null>;
  findBoletasForResumen(
    sucursalId: number,
    serieId: number,
    fechaResumen: string,
    estados: EstadoEnumComprobante[],
  ): Promise<ComprobanteResponseDto[]>;
  findBySerieCorrelativos(
    sucursalId: number,
    serieCorrelativos: string[],
  ): Promise<ComprobanteResponseDto[]>
}
