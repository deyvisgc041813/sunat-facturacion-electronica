export class GetCertificadoDto {
  constructor(
    public readonly certificadoDigital: Buffer,
    public readonly claveCertificado: string,
    public readonly usuarioSolSecundario: string,
    public readonly claveSolSecundario: string,
    public readonly correo: string,
    public readonly telefono: string,
    public readonly signatureId: string,
    public readonly signatureNote: string,
    public readonly codigoEstablecimiento: string,
  ) {}
}
