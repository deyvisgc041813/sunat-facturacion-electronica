import { ClienteResponseDto } from "../../cliente/dto/client.response.dto";
import { SucursalResponseDto } from "../../sucursal/dto/sucursal.response.dto";


export class EmpresaResponseDto {
    constructor(
    public empresaId: number,
    public ruc: string,
    public razonSocial: string,
    public logo:string,
    public email: string,
    public telefono:string,
    public fechaRegistro:Date,
    public certificadoNombreArchivo:string,
    public certificadoHash:string,
    public certificadoSubject:string,
    public certificadoIssuer:string,
    public certificadoValidoDesde:Date,
    public certificadoValidoHasta:Date,
    public plan:string,
    public nombreComercial?: string,
    public direccion?: string,
    public usuarioSolSecundario?: string,
    public estado?:string,
    public logoPublicId?:string,
    public certificadoPublicId?:string,
    public clienteSecret?: string,
    public clienteId?: string,
    public cliente?:ClienteResponseDto[],
    public sucursales?:SucursalResponseDto[]
  ) {}

}
