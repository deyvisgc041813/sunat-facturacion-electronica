import { ClienteResponseDto } from "../../cliente/dto/client.response.dto";
import { SucursalResponseDto } from "../../sucursal/dto/sucursal.response.dto";
import { EmpresaCredencialesInternaResponseDto, EmpresaCredencialesResponseDto } from "./credenciales-sunat.response.dto";


export class EmpresaResponseDto {
    constructor(
    public empresaId: number,
    public ruc: string,
    public razonSocial: string,
    public logo:string,
    public email: string,
    public telefono:string,
    public fechaRegistro:Date,
    public plan:string,
    public credenciales: EmpresaCredencialesResponseDto[] | EmpresaCredencialesInternaResponseDto[],
    public nombreComercial?: string,
    public direccion?: string,
    public cliente?:ClienteResponseDto[],
    public sucursales?:SucursalResponseDto[],

  ) {}

}
