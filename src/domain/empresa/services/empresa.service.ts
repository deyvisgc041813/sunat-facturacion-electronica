import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { CreateEmpresaDto } from 'src/domain/empresa/dto/create.request.dto';
import { EmpresaResponseDto } from 'src/domain/empresa/dto/external.response.dto';
import { EmpresaRepositoryImpl } from 'src/infrastructure/persistence/empresa/empresa.repository.impl';
import { CryptoUtil } from 'src/util/CryptoUtil';
import * as crypto from 'crypto';

import { v2 as cloudinary } from 'cloudinary';
import { UpdateEmpresaDto } from '../dto/update.request';
import { AuditoriaService } from 'src/domain/core/logs/service/auditoria.logs.service';
import { buildLogData } from 'src/common/core';
import { EAccionAudit, ETablaAudit } from 'src/util/general.enum';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { APLICACION_ORIGEN } from 'src/util/constantes';
import { EEstadosGlobales } from 'src/util/estado.enum';
import { obtenerDescPlan } from 'src/util/Helpers';
// import forge from 'node-forge';
const forge = require('node-forge');

@Injectable()
export class EmpresaService {
  constructor(
    private readonly empRepo: EmpresaRepositoryImpl,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async save(
    data: CreateEmpresaDto,
    auth: IUserPayload,
  ): Promise<GenericResponse<EmpresaResponseDto>> {
    try {
      // 1. Validar archivo
      if (!this.esArchivoPfxValido(data.certificado_digital)) {
        throw new BadRequestException('El archivo no es un certificado válido');
      }
      // 2. Validar clave con node-forge
      const metadatos = this.validarClaveCertificado(
        data.certificado_digital,
        data.claveCertificado,
      );
      if (!metadatos.status) {
        throw new UnauthorizedException(
          'La clave del certificado es incorrecta',
        );
      }
      data.certificadoHash = this.generarHash(data.certificado_digital);
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
      data.plan = obtenerDescPlan(data.plan)
      const newEmpresa = await this.empRepo.save(data);
      const logData = buildLogData({
        tablaAfectada: ETablaAudit.EMPRESA,
        accion: EAccionAudit.INSERT,
        valoresNuevos: newEmpresa,
        usuario: auth,
        idRegistro: newEmpresa.data?.empresaId,
        entorno: '',
        observacion: 'Crear emoresa',
        aplicacionOrigen: APLICACION_ORIGEN,
        sucursalId: 0,
      });
      await this.auditoriaService.saveLog(logData);
      return newEmpresa;
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
    empresaEdit: EmpresaResponseDto,
    data: UpdateEmpresaDto,
    auth: IUserPayload,
  ): Promise<GenericResponse<EmpresaResponseDto>> {
    // Si viene un nuevo certificado
    if (data.certificado_digital) {
      const nuevoHash = this.generarHash(data.certificado_digital);

      if (nuevoHash === empresaEdit.certificadoHash) {
        console.log('El certificado es el mismo, no se actualiza');
      } else {
        if (!this.esArchivoPfxValido(data.certificado_digital)) {
          throw new BadRequestException(
            'El archivo no es un certificado válido',
          );
        }
        const metadatos = this.validarClaveCertificado(
          data.certificado_digital,
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
      delete data.logo;
    }
    data.plan = obtenerDescPlan(data.plan ?? "")
    const updateEmpresa = await this.empRepo.update(
      empresaEdit.empresaId,
      data,
    );
    const logData = buildLogData({
      tablaAfectada: ETablaAudit.EMPRESA,
      accion: EAccionAudit.UPDATE,
      valoresAnteriores: JSON.stringify(empresaEdit),
      valoresNuevos: JSON.stringify(updateEmpresa),
      idRegistro: empresaEdit.empresaId,
      usuario: auth,
      entorno: '',
      observacion: 'Actualizar empresa',
      aplicacionOrigen: APLICACION_ORIGEN,
      sucursalId: 0,
    });
    await this.auditoriaService.saveLog(logData);
    return updateEmpresa;
  }

  async delete(
    empresaId: number,
    auth: IUserPayload,
  ): Promise<GenericResponse<void>> {
    try {
      const rsp = await this.empRepo.updateStatus(
        empresaId,
        EEstadosGlobales.ELIMINADO
      );
      const logData = buildLogData({
        tablaAfectada: ETablaAudit.EMPRESA,
        accion: EAccionAudit.DELETE,
        usuario: auth,
        idRegistro: empresaId,
        entorno: '',
        observacion: 'Eliminar empresa',
        aplicacionOrigen: APLICACION_ORIGEN,
        sucursalId: 0,
      });
      await this.auditoriaService.saveLog(logData);
      rsp.message = 'La empresa se elimino correctamente';
      return rsp;
    } catch (error: any) {
      throw error;
    }
  }
  async updateStatus(
    empresaId: number,
    nuevoEstado: any,
    auth: IUserPayload,
  ): Promise<GenericResponse<void>> {
    if (
      ![EEstadosGlobales.ACTIVO, EEstadosGlobales.INACTIVO].includes( nuevoEstado,
      )
    ) {
      throw new BadRequestException(
        'El estado solo puede ser 1 (activo) o 0 (inactivo)',
      );
    }
    const serie = await this.empRepo.updateStatus(
      empresaId,
      nuevoEstado,
    );
    if (!serie) throw new NotFoundException('Empresa no encontrada');

    const accion =
      nuevoEstado === EEstadosGlobales.ACTIVO
        ? 'Empresa activada (estado=1)'
        : 'Empresa desactivada (estado=0)';
    const logData = buildLogData({
      tablaAfectada: ETablaAudit.EMPRESA,
      accion: EAccionAudit.UPDATE,
      usuario: auth,
      observacion: accion,
      aplicacionOrigen: APLICACION_ORIGEN,
      idRegistro: empresaId,
      sucursalId: 0,
    });
    await this.auditoriaService.saveLog(logData);
    return {
      status: true,
      message: accion,
    };
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
