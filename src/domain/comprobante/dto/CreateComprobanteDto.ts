export class CreateComprobanteDto {
  // Relación con empresa y cliente
  empresaId: number;
  clienteId: number;
  serieId: number;

  // Datos de cabecera del comprobante
  tipoComprobante: string;   // 01 = factura, 03 = boleta, 07 = nota crédito, 08 = nota débito
  serie: string;             // F001, B001, etc.
  numeroComprobante: number; // correlativo asignado
  fechaEmision: Date;
  moneda: string;           // PEN, USD

  // Totales
  totalGravado?: number;
  totalExonerado?: number;
  totalInafecto?: number;
  totalIgv: number;
  total: number;

  // Estado del comprobante
  estado: string; // PENDIENTE, ACEPTADO, RECHAZADO, etc.

  // Archivos asociados
  xmlFirmado?: string;  // XML firmado en texto
  cdr?: Buffer;         // CDR devuelto por SUNAT (ZIP base64 -> buffer)
  hashCpe?: string;     // hash del comprobante (DigestValue)
  // Respaldo del JSON original
  payloadJson?: string;
  constructor(partial?: Partial<CreateComprobanteDto>) {
    Object.assign(this, partial);
  }
}
