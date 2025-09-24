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
  findAll(empresaId: number): Promise<ComprobanteResponseDto[]>;

  /**
   * Busca un comprobante por su ID.
   */

  findByEmpresaAndId(
    empresaId: number,
    comprobanteIds: number[],
  ): Promise<ComprobanteResponseDto[] | null>;

  // 📄 XML firmado
  getXmlFirmado(
    comprobanteId: number,
    empresaId: number,
  ): Promise<ArchivoDescargable | null>;

  // 📦 ZIP enviado a SUNAT
  getZipEnviado(
    comprobanteId: number,
    empresaId: number,
  ): Promise<ArchivoDescargable | null>;

  // 📩 ZIP CDR de SUNAT
  getCdrZip(
    comprobanteId: number,
    empresaId: number,
  ): Promise<ArchivoDescargable | null>;

  // 🔑 Hash del comprobante
  getHashCpe(comprobanteId: number, empresaId: number): Promise<string | null>;

  /**
   * Retorna el hash del comprobante (firmado).
   */
  getHashCpe(comprobanteId: number, empresaId: number): Promise<string | null>;

  // 🔄 Un solo método de actualización flexible
  update(
    comprobanteId: number,
    empresaId: number,
    update: IUpdateComprobante,
  ): Promise<{ status: boolean; message: string }>;

  /**
   * Lista los comprobantes por estado (ej: todos los pendientes, todos los rechazados).
   */
  findByEstado(
    estado: EstadoEnumComprobante,
    empresaId: number,
  ): Promise<ComprobanteResponseDto[]>;

  /**
   * Obtiene todos los comprobantes de una empresa en un rango de fechas.
   */
  findByEmpresaAndFecha(
    empresaId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<ComprobanteResponseDto[]>;
  findByEmpAndSerieAndNumCorreAceptado(
    empresaId: number,
    serieId: number,
    numCorrelativo: number,
  ): Promise<ComprobanteResponseDto | null>;
  /**
   * Actualizar el estado de un comprobante (ej: comunicación de baja).
   */
  updateComprobanteStatus(
    empresaId: number,
    serieId: number,
    numCorrelativo: number,
    desEstado: string,
    estado: EstadoEnumComprobante,
  ): Promise<boolean>;
  updateComprobanteStatusMultiple(
    empresaId: number,
    comprobanteIds: number[],
    nuevoEstado: EstadoEnumComprobante,
    comunicadoSunat: EstadoComunicacionEnvioSunat
  );
  updateBoletaStatus(
    empresaId: number,
    boletasIds: number[],
    nuevoEstado: EstadoEnumComprobante,
    comunicadoSunat: EstadoComunicacionEnvioSunat,
  );
  findComprobanteByReferencia(
    empresaId: number,
    tipoComprobante: string,
    motivos: string[],
    estado: string,
    serieRef: string,
    correlativoRef: number,
  ): Promise<ComprobanteResponseDto | null>;
  findBoletasForResumen(
    empresaId: number,
    serieId: number,
    fechaResumen: string,
    estados: EstadoEnumComprobante[],
  ): Promise<ComprobanteResponseDto[]>;
}
