
import { EmpresaResponseDto } from "./EmpresaResponseDto";

// DTO extendido para uso interno
// DTO extendido (interno, añade credenciales)
export class EmpresaInternaResponseDto extends EmpresaResponseDto {
  constructor(
    base: EmpresaResponseDto, // <- aquí recibes el dto base
    public claveCertificado?: string,
    public claveSolSecundario?: string,
    public certificadoDigital?: Buffer | undefined
  ) {
    super(
      base.empresaId,
      base.ruc,
      base.razonSocial,
      base.logo,
      base.email,
      base.telefono,
      base.fechaRegistro,
      base.certificadoNombreArchivo,
      base.certificadoHash,
      base.certificadoSubject,
      base.certificadoIssuer,
      base.certificadoValidoDesde,
      base.certificadoValidoHasta,
      base.nombreComercial,
      base.direccion,
      base.usuarioSolSecundario,
      base.modo,
      base.estado,
      base.logoPublicId,
      base.certificadoPublicId,
      base.cliente
    );
  }
}