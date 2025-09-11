import { EmpresaResponseDto } from "../../empresa/dto/EmpresaResponseDto";

export class ClienteResponseDto {
 
  constructor(
    public clienteId: number,
    public readonly tipoDocumento: string,
    public readonly numeroDocumento: string,
    public readonly razonSocial?: string,
    public readonly estado?: number,
    public readonly direccion?: string,
    public readonly correo?: string,
    public readonly telefono?: string,
    public readonly nombre?: string,
    public readonly apellidoPaterno?: string,
    public readonly apellidoMaterno?: string,
    public readonly estadoComtribuyente?: string,
    public readonly condicionDomicilio?: string,
    public empresa?: EmpresaResponseDto
  ) {}

}


