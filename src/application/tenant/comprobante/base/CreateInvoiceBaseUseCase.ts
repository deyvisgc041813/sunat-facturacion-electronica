import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { CryptoUtil } from 'src/util/CryptoUtil';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { BadRequestException } from '@nestjs/common';
import {
  CodigoSunatTasasEnum,
  TipoCatalogoEnum,
  TipoComprobanteEnum,
} from 'src/util/catalogo.enum';
import { EstadoEnumComprobante } from 'src/util/estado.enum';

import { XmlBuilderInvoiceService } from 'src/infrastructure/sunat/xml/xml-builder-invoice.service';
import { ComprobantesHelper } from 'src/util/comprobante-helpers';
import { MAP_TRIBUTOS } from 'src/util/constantes';
import { FindTasaByCodeUseCase } from 'src/application/parent/Tasa/FindTasaByCodeUseCase';
import { CreateInvoiceDto } from 'src/domain/tenant/comprobante/dto/invoice/create.invoice.dto';
import { IResponseSunat } from 'src/domain/tenant/comprobante/interface/response.sunat.interface';
import { ICatalogoRepositoryPort } from 'src/domain/parent/catalogo/port/catalogo.repository.port';
import { ITributoTasaRepositoryPort } from 'src/domain/parent/tributo-tasa/port/tasa-tributo.repository.port';
import { ComprobanteService } from '../../../../domain/tenant/comprobante/services/comprobante.service';
import { SucursalService } from 'src/domain/parent/sucursal/service/sucursal.service';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
const tasasTributos = [MAP_TRIBUTOS.IGV.id, MAP_TRIBUTOS.ICBPER.id];
const tasasVigentes = [MAP_TRIBUTOS.IGV.id];
const tiposCatalogos = [
  TipoCatalogoEnum.UNIDAD_MEDIDA,
  TipoCatalogoEnum.TIPO_AFECTACION,
];
export abstract class CreateInvoiceBaseUseCase {
  constructor(
    protected readonly xmlInvoiceBuilder: XmlBuilderInvoiceService,
    protected readonly firmaService: FirmaService,
    protected readonly sunatService: SunatService,
    protected readonly sucuralService: SucursalService,
    protected readonly catalogoRepo: ICatalogoRepositoryPort,
    protected readonly tributoRepo: ITributoTasaRepositoryPort,
    protected readonly findTasaByCodeUseCase: FindTasaByCodeUseCase,
    protected readonly comprobanteService: ComprobanteService,
  ) {}

  //protected abstract buildXml(data: CreateInvoiceDto): string;

  async execute(
    data: CreateInvoiceDto,
    auth: IUserPayload,
  ): Promise<IResponseSunat> {
    const empresaId = auth?.empresaId ?? 0;
    const surcursalId = auth.sucursalActiva ?? 0;
    ComprobantesHelper.validarDetallesGeneralesPorComprobante(data);
    const sucursal = await this.sucuralService.getDigitalCertificate(
      surcursalId,
      empresaId,
    );
    const contextoError = {
      comprobanteId: 0,
      sucursalId: 0,
      xmlFirmado: '',
      data,
    };
    try {
      const client = await this.comprobanteService.consultarDocumento(
        empresaId,
        auth,
        data?.client,
      );

      const catologo =
        (await this.catalogoRepo.obtenertipoCatalogo(tiposCatalogos)) ?? [];
      const tasas =
        (await this.tributoRepo.findByCodigosSunat(tasasTributos)) ?? [];
      const tributosTasa =
        (await this.findTasaByCodeUseCase.execute(tasasVigentes)) ?? [];
      const tasaIgv = tributosTasa.get(CodigoSunatTasasEnum.IGV);
      data.porcentajeIgv = tasaIgv == null ? 0.18 : tasaIgv / 100;
      // 1. Validar item de la factura
      const errores = ComprobantesHelper.validarDetalleInvoice(
        data.details,
        catologo,
        tasas,
      );
      if (errores.length > 0) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Error de validación en los detalles del comprobante',
          errors: errores,
        });
      }
      // 2. Recalcular montos
      const invoice = ComprobantesHelper.recalcularMontos(data);
      // 3. Registrar comprobante en BD
      const comprobante = await this.comprobanteService.registrarComprobante(
        invoice,
        surcursalId,
        client?.clienteId,
      );
      contextoError.comprobanteId = comprobante.data?.comprobanteId ?? 0;
      invoice.correlativo = comprobante.data?.correlativo ?? 0;
      // esto tambien agregar en nota de credito y debito , resumens y bajas
      ((invoice.correoEmpresa = sucursal.correo),
        (invoice.telefonoEmpresa = sucursal.telefono));
      invoice.signatureId = sucursal?.signatureId ?? '';
      invoice.signatureNote = sucursal?.signatureNote ?? '';
      invoice.codigoEstablecimiento = sucursal?.codigoEstablecimiento ?? '';
      // 4. Construir, firmar y comprimir XML
      const { xmlFirmado, fileName, zipBuffer } =
        await this.comprobanteService.prepararXmlFirmado(
          invoice,
          sucursal.certificadoDigital,
          sucursal.claveCertificado,
          this.xmlInvoiceBuilder,
        );
      contextoError.xmlFirmado = xmlFirmado;
      contextoError.sucursalId = surcursalId;
      const usuarioSecundario = sucursal?.usuarioSolSecundario ?? '';
      const claveSecundaria = CryptoUtil.decrypt( sucursal.claveSolSecundario ?? '',
      );
      // 5. Enviar a SUNAT
      const responseSunat = await this.enviarASunat(
        xmlFirmado,
        invoice.tipoComprobante,
        fileName,
        zipBuffer,
        usuarioSecundario,
        claveSecundaria,
      );
      responseSunat.xmlFirmado = xmlFirmado;
      // 6. Actualizar comprobante con CDR, Hash y estado
      await this.comprobanteService.actualizarComprobante(
        contextoError.comprobanteId,
        surcursalId,
        invoice.tipoComprobante as TipoComprobanteEnum,
        xmlFirmado,
        responseSunat,
      );

      return responseSunat;
    } catch (error: any) {
      await this.comprobanteService.procesarErrorSunat(
        error,
        contextoError.data,
        contextoError.comprobanteId,
        contextoError.sucursalId,
        contextoError.xmlFirmado,
      );
      throw error;
    }
  }

  private async enviarASunat(
    xmlFirmado: any,
    tipoComprobante: string,
    fileName: string,
    zipBuffer: Buffer,
    usuarioSolSecundario: string,
    claveSolSecundario: string,
  ): Promise<IResponseSunat> {
    switch (tipoComprobante) {
      case TipoComprobanteEnum.FACTURA:
        return await this.sunatService.sendBill(
          `${fileName}.zip`,
          zipBuffer,
          usuarioSolSecundario,
          claveSolSecundario,
        );

      case TipoComprobanteEnum.BOLETA:
        return {
          cdr: null,
          estadoSunat: EstadoEnumComprobante.PENDIENTE,
          mensaje: 'La boleta fue registrada correctamente.',
          observaciones: [],
          status: true,
          codigoResponse: '',
          xmlFirmado,
        };

      default:
        return {
          cdr: null,
          estadoSunat: EstadoEnumComprobante.ERROR,
          mensaje: `Tipo de comprobante no soportado: ${tipoComprobante}`,
          observaciones: [],
          status: false,
          codigoResponse: '',
          xmlFirmado,
        };
    }
  }
}
