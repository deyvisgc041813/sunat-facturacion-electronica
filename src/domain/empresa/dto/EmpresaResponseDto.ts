import { ClienteResponseDto } from "src/domain/cliente/dto/ClienteResponseDto";
import { SucursalResponseDto } from "src/domain/sucursal/dto/SucursalResponseDto";

export class EmpresaResponseDto {
    constructor(
    public empresaId: number,
    public ruc: string,
    public razonSocial: string,
    public logo:string,
    public email: string,
    public telefono:string,
    public fechaRegistro:Date,
    public nombreComercial?: string,
    public direccion?: string,
    public usuarioSolSecundario?: string,
    public modo?:string,
    public estado?:number,
    public logoPublicId?:string,
    public cliente?:ClienteResponseDto[],
    public sucursales?:SucursalResponseDto[]
  ) {}

}
