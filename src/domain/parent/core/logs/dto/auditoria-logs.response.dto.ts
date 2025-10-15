
export class AuditoriaLogsResponseDto {
  constructor(
    public readonly logId: number,
    public readonly tabla: string,
    public readonly registroId:number,
    public readonly accion:string,
    public readonly valoresAnteriores: any,
    public readonly valoresNuevos: any,
    public readonly usuarioId:number,
     public readonly nombreUsuario:string,
    public readonly sucursalId:number,
    public readonly aplicacionOrigen:string,

    public readonly entorno?: string,
    public readonly observacion?: string,
  ) {}

}