import { SerieAuditoriaResponseDto } from "src/domain/series-auditoria/dto/SerieAuditoriaResponseDto";
import { SucursalResponseDto } from "src/domain/sucursal/dto/sucursal.response.dto";

export class UsuarioResponseDto {
  constructor(
    public readonly usuarioId: number,
    public readonly correo: string,
    public readonly nombre:string,
    public readonly estado:string,
    public readonly roles: RoleRequestDto[], // relación Many-to-Many
    public readonly sucursales:SucursalResponseDto[],
    public readonly clave?:string,
    public readonly auditorias?: SerieAuditoriaResponseDto[],
    public readonly fecSelecSucursal?: Date,
    public readonly sucursalActiva?:number,
  ) {}

}

export class RoleRequestDto {
  constructor(
    public readonly roleId: number,
    public readonly nombre: string,
  ) {}
}
