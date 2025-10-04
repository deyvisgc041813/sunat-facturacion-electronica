import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { CreateEmpresaDto } from 'src/domain/empresa/dto/CreateEmpresaDto';
import { EmpresaResponseDto } from 'src/domain/empresa/dto/EmpresaResponseDto';
import { EmpresaRepositoryImpl } from 'src/infrastructure/persistence/empresa/empresa.repository.impl';
import { CryptoUtil } from 'src/util/CryptoUtil';
import * as crypto from 'crypto';

import { v2 as cloudinary } from 'cloudinary';
import { UpdateEmpresaDto } from '../dto/UpdateEmpresaDto';
// import forge from 'node-forge';
const forge = require('node-forge');

@Injectable()
export class EmpresaService {
  constructor(private readonly empRepo: EmpresaRepositoryImpl) {}

  async save(
    data: CreateEmpresaDto,
  ): Promise<GenericResponse<EmpresaResponseDto>> {
    try {
      // 1. Validar archivo
      if (!this.esArchivoPfxValido(data.certificadoDigital)) {
        throw new BadRequestException('El archivo no es un certificado válido');
      }
      // 2. Validar clave con node-forge
      const metadatos = this.validarClaveCertificado(
        data.certificadoDigital,
        data.claveCertificado,
      );
      if (!metadatos.status) {
        throw new UnauthorizedException(
          'La clave del certificado es incorrecta',
        );
      }
      data.certificadoHash = this.generarHash(data.certificadoDigital);
      data.certificadoSubject = metadatos.subject;
      data.certificadoIssuer = metadatos.issuer;
      data.certificadoValidoDesde = metadatos.validoDesde;
      data.certificadoValidoHasta = metadatos.validoHasta;

      // Clave Certificado -> AES
      const encryptedClaveSolSecundario = data.claveSolSecundario
        ? CryptoUtil.encrypt(data.claveSolSecundario)
        : null;
      const encryptedClaveCert = data.claveCertificado
        ? CryptoUtil.encrypt(data.claveCertificado)
        : null;
      data.claveSolSecundario = encryptedClaveSolSecundario ?? '';
      data.claveCertificado = encryptedClaveCert ?? '';
      const fileMain = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: `logos/${data.ruc}/`, resource_type: 'image' },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            },
          )
          .end(data.logo);
      });
      data.logo = fileMain?.url;
      data.logoPublicId = fileMain.public_id;
      return this.empRepo.save(data);
    } catch (err: any) {
      console.log(err);
      throw err;
    }
  }
  async getAll(): Promise<EmpresaResponseDto[]> {
    return this.empRepo.findAll();
  }
  async getById(empresaId: number): Promise<EmpresaResponseDto | null> {
    return this.empRepo.findById(empresaId, false);
  }
  async update(
    empresa: EmpresaResponseDto,
    data: UpdateEmpresaDto,
  ): Promise<GenericResponse<EmpresaResponseDto>> {
    // Si viene un nuevo certificado
    if (data.certificadoDigital) {
      const nuevoHash = this.generarHash(data.certificadoDigital);

      if (nuevoHash === empresa.certificadoHash) {
        console.log('El certificado es el mismo, no se actualiza');
      } else {
        if (!this.esArchivoPfxValido(data.certificadoDigital)) {
          throw new BadRequestException(
            'El archivo no es un certificado válido',
          );
        }
        const metadatos = this.validarClaveCertificado(
          data.certificadoDigital,
          data.claveCertificado ?? '',
        );
        if (!metadatos.status) {
          throw new UnauthorizedException(
            'La clave del certificado es incorrecta',
          );
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
        data.certificadoHash = nuevoHash;
        data.certificadoSubject = metadatos.subject;
        data.certificadoIssuer = metadatos.issuer;
        data.certificadoValidoDesde = metadatos.validoDesde;
        data.certificadoValidoHasta = metadatos.validoHasta;
      }
    }
    if (data.logo && data.logoPublicId) {
      await cloudinary.uploader.destroy(data.logoPublicId);
      const fileMain = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: `logos/${data.ruc}/`, resource_type: 'image' },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            },
          )
          .end(data.logo);
      });
      data.logo = fileMain?.url;
      data.logoPublicId = fileMain.public_id;
    } else {
      delete data.logo 
    }
    return this.empRepo.update(empresa.empresaId, data);
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
  private validarClaveCertificado(
    buffer: Buffer,
    clave: string,
  ): {
    subject: string;
    issuer: string;
    validoDesde: any;
    validoHasta: any;
    status: boolean;
  } {
    const response = {
      subject: '',
      issuer: '',
      validoDesde: null,
      validoHasta: null,
      status: false,
    };
    try {
      const p12Der = forge.util.createBuffer(
        buffer.toString('binary'),
        'binary',
      );
      const asn1 = forge.asn1.fromDer(p12Der);
      const pkcs12 = forge.pkcs12.pkcs12FromAsn1(asn1, clave); // ahora sí probamos con la clave
      // Buscar el certificado dentro del contenedor
      const certBags = pkcs12.getBags({ bagType: forge.pki.oids.certBag });
      const cert = certBags[forge.pki.oids.certBag][0].cert;
      // 4. Extraer campos
      const subject = cert.subject.getField('CN')?.value || '';
      const issuer = cert.issuer.getField('CN')?.value || '';
      const validoDesde = cert.validity.notBefore;
      const validoHasta = cert.validity.notAfter;
      response.subject = subject;
      response.issuer = issuer;
      response.validoDesde = validoDesde;
      response.validoHasta = validoHasta;
      response.status = true;
      return response;
    } catch (err) {
      console.error('Clave incorrecta o certificado inválido:', err.message);
      return response;
    }
  }
  private generarHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

}
