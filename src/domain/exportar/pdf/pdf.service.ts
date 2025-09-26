export interface IPdfService {
  generarBoleta(datos: any): Promise<Buffer>;
}