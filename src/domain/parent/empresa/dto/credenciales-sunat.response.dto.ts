export class EmpresaCredencialesResponseDto {
  constructor(
    public credId: number,
    public ambiente: string,
    public clientId: string,
    public usuarioSolSecundario: string,
    public certificadoNombre: string,
    public certificadoHash: string,
    public certificadoSubject: string,
    public certificadoIssuer: string,
    public certificadoValidoDesde: Date,
    public certificadoValidoHasta: Date,
    public certificadoPublicId: string,
    public estado: string,
    public fechaRegistro: Date,
  ) {}
}

export class EmpresaCredencialesInternaResponseDto {
  constructor(
    public base: EmpresaCredencialesResponseDto,
    public clientSecret: string,
    public claveSolSecundario: string,
    public claveCertificado: string,
    public certificadoDigital: Buffer,
    public token: string,
    public tokenExpira: Date,
  ) {}
}
