import { IComunicacionBajaDetalle } from "./baja.detalle.interface";

export interface CreateComunicacionBajaDto {
  sucursalId: number;                 // sucursal emisora
  fechaGeneracion: Date;             // Fecha en que se genera la comunicación de baja
  fecReferencia: Date;               // Fecha de los comprobantes a dar de baja
  correlativo: number;               // Número correlativo del RA
  nombreArchivo: string;             // Nombre del archivo XML generado
  estado: string;                    // Estado interno (PENDIENTE, ENVIADO, ACEPTADO, RECHAZADO, ERROR)
  serie: string;                     // Serie RA-YYYYMMDD
  ticket: string | "";             // Ticket de SUNAT
  xml: string | "";                // Contenido XML enviado a SUNAT
  cdr?: string | "";                // Constancia de Recepción (en base64 o XML)
  hashComunicacion?: string | "";   // Hash del documento firmado
  detalle: IComunicacionBajaDetalle[]
}
