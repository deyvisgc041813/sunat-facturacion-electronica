import { ProductoResponseDto } from "src/domain/tenant/inventario/producto/dto/producto.response.dto";
import { EmpresaResponseDto } from "../../empresa/dto/external.response.dto";
import { EmpresaInternaResponseDto } from "../../empresa/dto/internal.response.dto";
import { SerieResponseDto } from "src/domain/tenant/serie-comprobante/dto/reesponse.dto";
import { ComprobanteResponseDto } from "src/domain/tenant/comprobante/dto/conprobante.response.dto";
import { ResumenResponseDto } from "src/domain/tenant/resumen/dto/resumen.response.dto";
import { SunatLogResponseDto } from "src/domain/tenant/sunat-log/interface/sunat.log.interface";
import { UbigeoResponseDto } from "../../ubigeo/dto/ubigeo.response";
import { BajaComprobanteResponseDto } from "src/domain/tenant/comunicacion-baja/dto/ComunicacionBajaResponseDto";

export class SucursalResponseDto {
  constructor(
    public sucursalId: number,
    public codigo: string,
    public nombre: string,
    public direccion: string,
    public codigoEstablecimiento:string,
    public subDominio:string,
    public entorno:string,
    public ubigeo?: string,
    public telefono?: string,
    public email?: string,
    public signatureId?: string,
    public signatureNote?: string,

    public estado?: string,
    public fechaRegistro?: Date,
    public usuarioRegistro?:string,
    public usuarioModificacion?:string,
    public fechaModificacion?: Date,
    public empresa?: EmpresaResponseDto | EmpresaInternaResponseDto,
    public productos?: ProductoResponseDto[],
    public series?: SerieResponseDto[],
    public comprobantes?: ComprobanteResponseDto[],
    public resumenes?: ResumenResponseDto[],
    public bajas?: BajaComprobanteResponseDto[],
    public sunatLogs?: SunatLogResponseDto[],
    public ubicacionGeografica?: UbigeoResponseDto,
  ) {}
}
