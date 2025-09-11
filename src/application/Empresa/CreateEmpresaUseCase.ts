import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { CreateEmpresaDto } from 'src/domain/empresa/dto/CreateEmpresaDto';
import { EmpresaResponseDto } from 'src/domain/empresa/dto/EmpresaResponseDto';
import { EmpresaRepository } from 'src/domain/empresa/Empresa.repository';
import { CryptoUtil } from 'src/domain/util/CryptoUtil';
const forge = require('node-forge');
export class CreateEmpresaUseCase {
  constructor(private readonly empresaRepo: EmpresaRepository) {}
  async execute(
    data: CreateEmpresaDto,
  ): Promise<{ status: boolean; message: string; data?: EmpresaResponseDto }> {
    // 1. Validar archivo
    if (!this.esArchivoPfxValido(data.certificadoDigital)) {
      throw new BadRequestException('El archivo no es un certificado válido');
    }
    // 2. Validar clave con node-forge
    if (
      !this.validarClaveCertificado(
        data.certificadoDigital,
        data.claveCertificado,
      )
    ) {
      throw new UnauthorizedException('La clave del certificado es incorrecta');
    }
    // Clave Certificado -> AES
    const encryptedClaveSolSecundario = data.claveSolSecundario
      ? CryptoUtil.encrypt(data.claveSolSecundario)
      : null;
    const encryptedClaveCert = data.claveCertificado
      ? CryptoUtil.encrypt(data.claveCertificado)
      : null;
    data.claveSolSecundario = encryptedClaveSolSecundario ?? '';
    data.claveCertificado = encryptedClaveCert ?? '';
    return this.empresaRepo.save(data);
  }

  private esArchivoPfxValido(buffer: Buffer): boolean {
    try {
      // usar loop para armar string de bytes crudos
      const binaryStr = Array.from(buffer, (byte) =>
        String.fromCharCode(byte),
      ).join('');
      const p12Der = forge.util.createBuffer(binaryStr, 'binary');
      forge.asn1.fromDer(p12Der); // solo parsea, no valida clave
      return true;
    } catch (err) {
      console.error('No es PFX válido:', err.message);
      return false;
    }
  }

  private validarClaveCertificado(buffer: Buffer, clave: string): boolean {
    try {
      const p12Der = forge.util.createBuffer(
        buffer.toString('binary'),
        'binary',
      );
      const asn1 = forge.asn1.fromDer(p12Der);
      forge.pkcs12.pkcs12FromAsn1(asn1, clave); // ahora sí probamos con la clave
      return true;
    } catch (err) {
      console.error('Clave incorrecta o certificado inválido:', err.message);
      return false;
    }
  }
}
