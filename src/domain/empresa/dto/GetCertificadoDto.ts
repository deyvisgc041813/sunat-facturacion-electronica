export class GetCertificadoDto {
    constructor(
    public readonly empresaId: number,
    public readonly certificadoDigital : Buffer,
    public readonly claveCertificado: string,
    public readonly usuarioSolSecundario: string,
    public readonly claveSolSecundario: string
  ) {}

}