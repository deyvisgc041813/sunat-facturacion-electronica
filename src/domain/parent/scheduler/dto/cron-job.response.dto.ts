import { EmpresaResponseDto } from "../../empresa/dto/external.response.dto";
import { EmpresaInternaResponseDto } from "../../empresa/dto/internal.response.dto";

export class CronJobResponseDto {
  constructor(
    public cronId: number,
    public tipo: string,
    public horaEjecucion: string,
    public proximaEjecucion:Date,
    public repetir:string,
    public estado:string,
    public payload?: any,
    public ultimaEjecucion?: any,
    public messageError?:string,
    public empresa?: EmpresaResponseDto | EmpresaInternaResponseDto
  ) {}
}
