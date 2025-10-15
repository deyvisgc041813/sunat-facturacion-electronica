export interface ResumenBoletaDetalleDto {
  resBolDetId?: number;   // ID autogenerado del detalle
  resumenId?: number;      // ID del resumen al que pertenece
  comprobanteId: number;  // ID del comprobante asociado
  operacion: string;      // Operación (ej: ALTA, BAJA)
}
