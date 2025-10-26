import { CryptoUtil } from 'src/util/CryptoUtil';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { BadRequestException } from '@nestjs/common';
import {
  CodigoSunatTasasEnum,
  TipoComprobanteEnum,
} from 'src/util/catalogo.enum';
import {
  EstadoEnumComprobante,
  EstadoEnvioSunatFactura,
} from 'src/util/estado.enum';
import { ComprobantesHelper } from 'src/util/comprobante-helpers';
import { CreateInvoiceDto } from 'src/domain/tenant/comprobante/dto/invoice/create.invoice.dto';
import { IResponseSunat } from 'src/domain/tenant/comprobante/interface/response.sunat.interface';
import { SucursalService } from 'src/domain/parent/sucursal/service/sucursal.service';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { ComprobanteService } from 'src/domain/tenant/comprobante/services/comprobante.service';
import {
  BusinessLogicException,
  BusinessLogicObjectException,
} from 'src/adapter/web/exception/exeception-dynamic';

export abstract class CreateInvoiceBaseUseCase {
  constructor(
    protected readonly sunatService: SunatService,
    protected readonly sucuralService: SucursalService,
    protected readonly comprobanteService: ComprobanteService,
  ) {}

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
    const contexto = {
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
      const catalogosTributos =
        await this.comprobanteService.cargarCatalogosTributarios();
      const tasaIgv = catalogosTributos.tributosTasa.get(
        CodigoSunatTasasEnum.IGV,
      );
      data.porcentajeIgv = tasaIgv == null ? 0.18 : tasaIgv / 100;
      // 1. Validar item de la factura
      const errores = ComprobantesHelper.validarDetalleInvoice(
        data.details,
        catalogosTributos.catologo,
        catalogosTributos.tasas,
      );
      if (errores.length > 0) {
        throw new BusinessLogicObjectException({
          success: false,
          statusCode: 422,
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
      contexto.comprobanteId = comprobante.data?.comprobanteId ?? 0;
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
        );
      contexto.xmlFirmado = xmlFirmado;
      contexto.sucursalId = surcursalId;
      const usuarioSecundario = sucursal?.usuarioSolSecundario ?? '';
      const claveSecundaria = CryptoUtil.decrypt(
        sucursal.claveSolSecundario ?? '',
      );
      let responseSunat: IResponseSunat = {
        estadoSunat: EstadoEnumComprobante.PENDIENTE,
        mensaje: 'El comprobante está pendiente de envío a SUNAT',
        observaciones: [],
        status: true,
        xmlFirmado: xmlFirmado,
        comprobanteId: contexto.comprobanteId,
      };
      if (EstadoEnvioSunatFactura.ENVIAR_SUNAT === invoice.enviarSunat) {
        // 5. Enviar a SUNAT
        responseSunat = await this.sendSunat(
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
          contexto.comprobanteId,
          surcursalId,
          invoice.tipoComprobante as TipoComprobanteEnum,
          xmlFirmado,
          responseSunat,
        );
        responseSunat.comprobanteId = contexto.comprobanteId;
      }
      return responseSunat;
    } catch (error: any) {
      await this.comprobanteService.procesarErrorSunat(
        error,
        contexto.data,
        contexto.comprobanteId,
        contexto.sucursalId,
        contexto.xmlFirmado,
      );
      throw error;
    }
  }

  private async sendSunat(
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
