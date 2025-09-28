import { ComprobanteResponseDto } from "src/domain/comprobante/dto/ConprobanteResponseDto";
import { BajaComprobanteResponseDto } from "src/domain/comunicacion-baja/ComunicacionBajaResponseDto";
import { EmpresaInternaResponseDto } from "src/domain/empresa/dto/EmpresaInternaResponseDto";
import { EmpresaResponseDto } from "src/domain/empresa/dto/EmpresaResponseDto";
import { ProductoResponseDto } from "src/domain/productos/dto/ProductoResponseDto";
import { ResumenResponseDto } from "src/domain/resumen/dto/ResumenResponseDto";
import { SerieResponseDto } from "src/domain/series/dto/SerieResponseDto";
import { SunatLogResponseDto } from "src/domain/sunat-log/interface/sunat.log.interface";


export class SucursalResponseDto {
  constructor(
    public sucursalId: number,
    public codigo: string,
    public nombre: string,
    public direccion: string,
    public codigoEstablecimientoSunat:string,
    public ubigeo?: string,
    public telefono?: string,
    public email?: string,
    public signatureId?: string,
    public signatureNote?: string,
    public estado?: number,
    public fechaCreacion?: Date,
    public empresa?: EmpresaResponseDto | EmpresaInternaResponseDto,
    public productos?: ProductoResponseDto[],
    public series?: SerieResponseDto[],
    public comprobantes?: ComprobanteResponseDto[],
    public resumenes?: ResumenResponseDto[],
    public bajas?: BajaComprobanteResponseDto[],
    public sunatLogs?: SunatLogResponseDto[],
  ) {}
}