import { ClienteResponseDto } from "src/domain/cliente/dto/ClienteResponseDto";
import { ProductoResponseDto } from "src/domain/productos/dto/ProductoResponseDto";

export class EmpresaResponseDto {
    constructor(
    public empresaId: number,
    public ruc: string,
    public razonSocial: string,
    public nombreComercial: string,
    public direccion?: string,
    public usuarioSolSecundario?: string,
    public modo?:string,
    public estado?:number,
    public cliente?:ClienteResponseDto[],
    public productos?:ProductoResponseDto[]
  ) {}

}
