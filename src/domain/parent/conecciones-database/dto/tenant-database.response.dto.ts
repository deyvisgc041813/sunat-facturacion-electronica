import { SucursalResponseDto } from "../../sucursal/dto/sucursal.response.dto";

export class TenantConnectionsResponseDto {
  constructor(
    public readonly coneccionId: number,
    public readonly dbName: string,
    public readonly estado:string,
    public readonly fechaRegistro: Date,
    public readonly dbUser:string,
    public readonly dbPassword:string,
    public readonly dbHost:string,
    public readonly dbPort:number,
    public readonly sucursal: SucursalResponseDto
  ) {}
}