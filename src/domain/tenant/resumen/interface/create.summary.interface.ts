import { ResumenBoletaDetalleDto } from "./create.summary.detalle.interface";

export interface CreateResumenBoletaDto {
  sucursalId: number;         // ID de la sucursal emisora
  fechaGeneracion: Date;     // Fecha en la que se genera el resumen
  fecReferencia: Date;       // Fecha de los comprobantes que se están resumiendo
  correlativo: number;       // Número correlativo del resumen
  nombreArchivo: string;    // Nombre del archivo XML
  estado: string;           // Estado del resumen (default: "PENDIENTE")
  xml: string;              // Contenido XML generado 
  ticket:string;
  resumenId:string;
  cdr?: string;              // Constancia de Recepción de SUNAT (opcional)
  hashResumen?: string;      // Hash del resumen firmado (opcional)
  detalle: ResumenBoletaDetalleDto[]
}
