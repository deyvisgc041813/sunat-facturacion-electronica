import { EmpresaCredencialesOrmEntity } from "src/infrastructure/persistence/parent/entity/empresa/empesa-credenciales-sunat.orm.entity";
import { EmpresaCredencialesInternaResponseDto, EmpresaCredencialesResponseDto } from "../parent/empresa/dto/credenciales-sunat.response.dto";
import { CreateEmpresaCredencialesDto } from "../parent/empresa/dto/create.credenciales-sunat.request.dto";
import { UpdateEmpresaCredencialesDto } from "../parent/empresa/dto/update.credenciales-sunat.request.dto";

export class EmpresaCredencialesMapper {
  static toDomain(orm: EmpresaCredencialesOrmEntity): EmpresaCredencialesResponseDto {
    return new EmpresaCredencialesResponseDto(
      orm.credId,
      orm.ambiente,
      orm.clientId,
      orm.usuarioSolSecundario,
      orm.certificadoNombre,
      orm.certificadoHash,
      orm.certificadoSubject,
      orm.certificadoIssuer,
      orm.certificadoValidoDesde,
      orm.certificadoValidoHasta,
      orm.certificadoPublicId,
      orm.estado,
      orm.fechaRegistro,
    );
  }

  static toDomainInterno(
    orm: EmpresaCredencialesOrmEntity,
  ): EmpresaCredencialesInternaResponseDto {
    const base = this.toDomain(orm);
    return new EmpresaCredencialesInternaResponseDto(
      base,
      orm.clientSecret,
      orm.claveSolSecundario,
      orm.claveCertificado,
      orm.certificadoDigital,
      orm.token,
      orm.tokenExpira,
    );
  }

  private static assignCommon(
    object: EmpresaCredencialesOrmEntity,
    data: any,
  ): EmpresaCredencialesOrmEntity {
    object.ambiente = data?.ambiente ?? 'prod';
    object.clientSecret = data?.clienteSecret;
    object.clientId = data.clienteId
    object.usuarioSolSecundario = data?.usuarioSolSecundario;
    object.claveSolSecundario = data?.claveSolSecundario;
    object.certificadoDigital = data?.certificado_digital;
    object.claveCertificado = data?.claveCertificado;
    object.certificadoNombre = data?.certificadoNombre;
    object.certificadoHash = data?.certificadoHash;
    object.certificadoSubject = data?.certificadoSubject;
    object.certificadoIssuer = data?.certificadoIssuer;
    object.certificadoValidoDesde = data?.certificadoValidoDesde;
    object.certificadoValidoHasta = data?.certificadoValidoHasta;
    object.certificadoPublicId = data?.certificadoPublicId;
    object.empresa = {empresaId: data.empresaId} as any
    object.token = data?.token;
    object.tokenExpira = data?.tokenExpira;
    object.estado = data?.estado ?? 'VIGENTE';
    return object;
  }

  static dtoToOrmCreate(dto: CreateEmpresaCredencialesDto): EmpresaCredencialesOrmEntity {
    return this.assignCommon(new EmpresaCredencialesOrmEntity(), dto);
  }

  static dtoToOrmUpdate(dto: UpdateEmpresaCredencialesDto): EmpresaCredencialesOrmEntity {
    return this.assignCommon(new EmpresaCredencialesOrmEntity(), dto);
  }
}
