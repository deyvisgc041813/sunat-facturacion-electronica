export interface ICreateAuditoriaLog {
  logId?: number;
  usuarioId: number;

  tablaAfectada: string; // Nombre de la tabla afectada
  registroId: number; // ID del registro modificado
  accion: 'INSERT' | 'UPDATE' | 'DELETE' | 'ANULACION' | string; // Tipo de acción
  valoresAnteriores?: any; // JSON con datos previos
  valoresNuevos?: any; // JSON con datos nuevos
  nombreUsuario?: string; // Nombre del usuario
  entorno?: string; // Ej: 'BETA' o 'PRODUCCION'
  observacion?: string; // Comentarios adicionales
  aplicacionOrigen?: string; // Ej: 'servicio-sucursales'
  sucursalId?: number;
  empresaId?:number
}
