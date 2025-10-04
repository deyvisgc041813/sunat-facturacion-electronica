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
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import e from 'express';
//import {forge} from 'node-forge'
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
      if (
        !this.validarClaveCertificado(
          data.certificadoDigital,
          data.claveCertificado,
        )
      ) {
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
      console.log(err)
      throw err;
    }
  }
  async getAll():Promise<EmpresaResponseDto[]> {
    return this.empRepo.findAll()
  }
  async getById(empresaId: number):Promise<EmpresaResponseDto | null> {
    return this.empRepo.findById(empresaId, false)
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
