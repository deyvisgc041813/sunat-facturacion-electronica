export interface IComunicacionBajaDetalle {
  bajaComprobanteDetalleId?: number;   // ID autogenerado del detalle
  motivo: string;      // motivo de la baja
  bajaId?: number;      // ID del resumen al que pertenece
  comprobanteId: number;  // ID del comprobante asociado

}
