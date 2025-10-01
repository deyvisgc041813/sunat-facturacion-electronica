import { IComprobantePdfDto } from "../pdf.interface";

export interface IPdfService {
  generarComprobanteA4(datos: IComprobantePdfDto): Promise<Buffer>;
  generarComprobanteTicket(datos: IComprobantePdfDto): Promise<Buffer>;
}