export interface GenericResponse<T = any> {
  status: boolean;   // indica éxito o error
  message: string;   // mensaje de detalle
  data?: T;          // payload opcional, puede ser de cualquier tipo
}
