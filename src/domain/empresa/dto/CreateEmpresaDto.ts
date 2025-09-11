export class CreateEmpresaDto {
  constructor(
    public readonly ruc: string,
    public readonly razonSocial: string,
    public certificadoDigital: Buffer,
    public readonly direccion: string,
    public claveCertificado: string,
    public readonly usuarioSolSecundario: string,
    public claveSolSecundario: string,
    public readonly modo: string = 'BETA',
    public readonly estado: number = 1,
  ) {}
}

