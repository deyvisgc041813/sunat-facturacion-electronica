
import { EmpresaResponseDto } from "./EmpresaResponseDto";

// DTO extendido para uso interno
// DTO extendido (interno, añade credenciales)
export class EmpresaInternaResponseDto extends EmpresaResponseDto {
  constructor(
    base: EmpresaResponseDto, // <- aquí recibes el dto base
    public claveCertificado?: string,
    public claveUsuarioSecundario?: string
  ) {
    // llamas al constructor del padre con los campos comunes
    super(
      base.empresaId,
      base.ruc,
      base.razonSocial,
      base.nombreComercial,
      base.direccion,
      base.usuarioSolSecundario,
      base.modo,
      base.estado,
      base.cliente,
      base.productos
    );
  }
}