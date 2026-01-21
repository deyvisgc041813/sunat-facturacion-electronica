import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { CryptoUtil } from 'src/util/CryptoUtil';
import * as crypto from 'crypto';

import { v2 as cloudinary } from 'cloudinary';
import { UpdateEmpresaDto } from '../dto/update.request';
import { buildLogData } from 'src/common/core';
import { EAccionAudit, ETablaAudit } from 'src/util/general.enum';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { APLICACION_ORIGEN } from 'src/util/constantes';
import { EEstadosGlobales } from 'src/util/estado.enum';
import { obtenerDescPlan } from 'src/util/Helpers';
import { EmpresaRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/empresa.repository.impl';
import { AuditoriaService } from '../../core/logs/service/auditoria.logs.service';
import { CreateEmpresaDto } from '../dto/create.request.dto';
import { EmpresaResponseDto } from '../dto/external.response.dto';
import { SucursalService } from '../../sucursal/service/sucursal.service';
import { CreateSucursalDto } from '../../sucursal/dto/create.request.dto';
import { TenantDatabaseService } from '../../conecciones-database/service/tenant-database.service';
import { AuthService } from 'src/domain/auth/services/auth.service';
import { UbigeoService } from '../../ubigeo/services/ubigeo.service';
import { BusinessLogicException } from 'src/adapter/web/exception/exeception-dynamic';
import { CreateEmpresaCredencialesDto } from '../dto/create.credenciales-sunat.request.dto';
import { UpdateEmpresaCredencialesDto } from '../dto/update.credenciales-sunat.request.dto';
import { SucursalOrmEntity } from 'src/infrastructure/persistence/parent/entity/sucursal.orm.entity';
import { QueryRunner } from 'typeorm';
import { UserSucursalesOrmEntity } from 'src/infrastructure/persistence/auth/user-sucursal.orm.entity';
import { UsuarioService } from 'src/domain/auth/services/usuario.service';
// import forge from 'node-forge';
const forge = require('node-forge');

@Injectable()
export class EmpresaService {
  private readonly logger = new Logger(EmpresaService.name);
  constructor(
    private readonly empRepo: EmpresaRepositoryImpl,
    private readonly sucursalService: SucursalService,
    private readonly tenantService: TenantDatabaseService,
    private readonly authService: AuthService,
    private readonly ubigeoService: UbigeoService,
    private readonly auditoriaService: AuditoriaService,
    private readonly userService: UsuarioService
  ) {}

  async getAll(): Promise<EmpresaResponseDto[]> {
    return this.empRepo.findAll();
  }
  async getById(empresaId: number): Promise<EmpresaResponseDto | null> {
    return this.empRepo.findById(empresaId, false);
  }
  async getByRuc(ruc: string): Promise<EmpresaResponseDto | null> {
    return this.empRepo.findByRuc(ruc, false);
  }

  async delete(
    empresaId: number,
    auth: IUserPayload,
  ): Promise<GenericResponse<void>> {
    try {
      const rsp = await this.empRepo.updateStatus(
        empresaId,
        EEstadosGlobales.ELIMINADO,
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
      ![EEstadosGlobales.ACTIVO, EEstadosGlobales.INACTIVO].includes(
        nuevoEstado,
      )
    ) {
      throw new BadRequestException(
        'El estado solo puede ser 1 (activo) o 0 (inactivo)',
      );
    }
    const serie = await this.empRepo.updateStatus(empresaId, nuevoEstado);
    if (!serie) throw new BusinessLogicException('Empresa no encontrada');

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
  async save(body: CreateEmpresaDto, auth: IUserPayload): Promise<any> {
  
    let createEmpresa: { empresaId: number; crencialId: number } = {
      crencialId: 0,
      empresaId: 0,
    };
    let sucursal: any = null;
    let activate: any = null;
    // 1. Validar archivo
    if (!this.esArchivoPfxValido(body.certificado_digital)) {
      throw new BusinessLogicException(
        'El archivo no es un certificado válido',
      );
    }
    // 2. Validar clave con node-forge
    const metadatos = this.validarClaveCertificado(
      body.certificado_digital,
      body.claveCertificado ?? '',
    );
    if (!metadatos.status) {
      throw new BusinessLogicException(
        'La clave del certificado es incorrecta',
      );
    }
    const dominioBase = process.env.DOMINIO_PRINCIPAL;
    const subDominioClient = body.subDominio.trim().toLowerCase();
    const subDominioCompleto = `${subDominioClient}.${dominioBase}`;
    try {
      createEmpresa = await this.saveEmpresa(body, auth);
      let createSucursal = new CreateSucursalDto();
      const distrito = await this.ubigeoService.getDistritoById(
        body.distritoId,
      );

      if (body.activarSucursal === '1') {
        createSucursal.empresaId = createEmpresa?.empresaId;
        ((createSucursal.distritoId = body.distritoId),
          (createSucursal.nombre = body.razonSocial));
        createSucursal.subDominio = subDominioCompleto;
        createSucursal.direccion = body.direccion;
        createSucursal.ubigeo = distrito?.ubigeo;
        createSucursal.telefono = body.telefono;
        createSucursal.email = body.email;
        createSucursal.signatureId =
          process.env.SIGNATURENOTE ?? 'FIRMADIGITALOnboarding';
        createSucursal.signatureNote =
          process.env.SIGNATUREID ?? 'DIGITALWEBFACTURALO';
        ((createSucursal.codigoEstablecimiento = body.codigoEstablecimiento),
          (createSucursal.entorno = body.ambiente));
        createSucursal.usuarioRegistro = auth.correo;
        createSucursal.estado = EEstadosGlobales.HABILITADA_FACTURACION;
        const user = await this.userService.findByUsername(auth.correo)
        sucursal = await this.sucursalService.create(createSucursal, auth, user?.usuarioId ?? 0);
      }
      const sucursalId = sucursal?.data?.sucursalId;
      let tenant: any = null
      if (body.activarSucursal === '1') {
        tenant = await this.tenantService.createTenant(
          sucursalId,
          body?.ruc,
          subDominioClient.replace(/[^a-z0-9]/g, ''),
        );
        auth.empresaId = createEmpresa?.empresaId;
        auth.credencialId = createEmpresa?.crencialId;
        activate = await this.authService.branchActive(sucursalId, auth, false);
        
      }
      return {
        success: true,
        message: 'La empresa y su sucursal han sido registradas y habilitadas para emitir comprobantes electrónicos.',
        activate,
        tenant
      };
    } catch (error) {
      this.logger.error('Error durante el onboarding', error);
      await this.tenantService
        .deleteTenant(
          sucursal?.data?.sucursalId,
          body?.ruc,
          subDominioClient?.replace(/[^a-z0-9]/g, ''),
        )
        .catch((e) => this.logger.warn('Rollback tenant falló', e));
      await this.sucursalService
        .deleteById(sucursal?.data?.sucursalId, createEmpresa.empresaId)
        .catch((e) => this.logger.warn('Rollback sucursal falló', e));

      await this.empRepo
        .deleteById(createEmpresa.empresaId)
        .catch((e) => this.logger.warn('Rollback empresa falló', e));
      throw error;
    }
  }
  async update(
    credencialId: number,
    empresaEdit: EmpresaResponseDto,
    data: UpdateEmpresaDto,
    auth: IUserPayload,
  ): Promise<GenericResponse<EmpresaResponseDto>> {
    const credencialUpdate: UpdateEmpresaCredencialesDto = { ...data };
    // Si viene un nuevo certificado
    if (data.certificado_digital) {
      const nuevoHash = this.generarHash(data.certificado_digital);
      const crenciales: any = empresaEdit.credenciales[0];
      if (nuevoHash === crenciales.certificadoHash) {
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
          throw new BusinessLogicException(
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
        credencialUpdate.claveSolSecundario = encryptedClaveSolSecundario ?? '';
        credencialUpdate.claveCertificado = encryptedClaveCert ?? '';
        credencialUpdate.certificadoHash = nuevoHash;
        credencialUpdate.certificadoSubject = metadatos.subject;
        credencialUpdate.certificadoIssuer = metadatos.issuer;
        credencialUpdate.certificadoValidoDesde = metadatos.validoDesde;
        credencialUpdate.certificadoValidoHasta = metadatos.validoHasta;
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
    data.plan = obtenerDescPlan(data.plan ?? '');
    const updateEmpresa = await this.empRepo.update(
      empresaEdit.empresaId,
      credencialId,
      data,
      credencialUpdate,
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
  async saveEmpresa(
    data: CreateEmpresaDto,
    auth: IUserPayload,
  ): Promise<{ empresaId: number; crencialId: number }> {
    try {
      // 1. Validar archivo
      if (!this.esArchivoPfxValido(data.certificado_digital)) {
        throw new BusinessLogicException(
          'El archivo no es un certificado válido',
        );
      }
      // 2. Validar clave con node-forge
      const metadatos = this.validarClaveCertificado(
        data.certificado_digital,
        data.claveCertificado ?? '',
      );
      if (!metadatos.status) {
        throw new BusinessLogicException(
          'La clave del certificado es incorrecta',
        );
      }

      const credenciales: CreateEmpresaCredencialesDto = { ...data };
      credenciales.certificadoHash = this.generarHash(data.certificado_digital);
      credenciales.certificadoSubject = metadatos.subject;
      credenciales.certificadoIssuer = metadatos.issuer;
      credenciales.certificadoValidoDesde = metadatos.validoDesde;
      credenciales.certificadoValidoHasta = metadatos.validoHasta;
      // Clave Certificado -> AES
      const encryptedClaveSolSecundario = data.claveSolSecundario
        ? CryptoUtil.encrypt(data.claveSolSecundario)
        : null;
      const encryptedClaveCert = data.claveCertificado
        ? CryptoUtil.encrypt(data.claveCertificado)
        : null;
      const encryptedClientSecret = data.clienteSecret
        ? CryptoUtil.encrypt(data.clienteSecret)
        : null;

      credenciales.claveSolSecundario = encryptedClaveSolSecundario ?? '';
      credenciales.claveCertificado = encryptedClaveCert ?? '';
      credenciales.clienteSecret = encryptedClientSecret ?? '';
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
      data.plan = obtenerDescPlan(data.plan);
      const newEmpresa = await this.empRepo.save(data, credenciales);
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
      return {
        empresaId: newEmpresa.data?.empresaId ?? 0,
        crencialId: newEmpresa.data?.crencialId ?? 0,
      };
    } catch (err: any) {
      console.log(err);
      throw err;
    }
  }
}
