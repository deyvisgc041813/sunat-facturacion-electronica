import { Injectable, HttpException, HttpStatus, Scope } from '@nestjs/common';
import axios from 'axios';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { CreateClienteDto } from 'src/domain/parent/cliente/dto/create.client.dto';
import { ClienteService } from 'src/domain/parent/cliente/service/cliente.service';
import { AuditoriaService } from 'src/domain/parent/core/logs/service/auditoria.logs.service';
import { ClienteDto } from 'src/domain/tenant/comprobante/dto/base/client.dto';
import { TipoComprobanteEnum } from 'src/util/catalogo.enum';
const tipoDocDni = new Set(["1", "01"])
const tipoRucs = new Set(["6", "06"])
@Injectable()
export class SearchDocumentService {
    constructor(
      private readonly clientService:   ClienteService,
    ) {}
  

  private readonly RENIEC_API = 'https://api.apis.net.pe/v1/dni';
  private readonly SUNAT_API = 'https://api.apis.net.pe/v1/ruc';
  private readonly TOKEN = process.env.APIS_PERU_TOKEN; // tu token de apis.net.pe

  /**
   * Método principal unificado.
   * Detecta si es DNI o RUC y llama al método correspondiente.
   */

  async consultarDocumento(empresaId:number, auth: IUserPayload, client: ClienteDto) {
    try {
      let cliente = await this.clientService.getByNumDocumento(client?.numDoc)
      if(!cliente) {
        const save = new CreateClienteDto({
          nombre: TipoComprobanteEnum.BOLETA === client?.tipoDoc ? client?.rznSocial : "",
          tipoDocumento: client?.tipoDoc,
          numeroDocumento:client?.numDoc,
          razonSocial: TipoComprobanteEnum.FACTURA === client?.tipoDoc ? client?.rznSocial : "",
          direccion: client?.address?.direccion,
          correo: client?.correo,
          telefono:client?.telefono

        })

  












        //cliente = this.clientService.create()
      }
      return cliente
      // if (tipoDocDni.has(tipo)) return await this.buscarDni(numero);
      // if (tipoRucs.has(tipo)) return await this.buscarRuc(numero);


    } catch (error) {
      console.error('Error en consultarDocumento:', error.message);
      throw new HttpException(
        'No se pudo consultar el documento',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Consulta DNI → RENIEC
   */
  private async buscarDni(numero: string) {
    try {
      const { data } = await axios.get(`${this.RENIEC_API}?numero=${numero}`, {
        headers: { Authorization: `Bearer ${this.TOKEN}` },
      });

      return {
        tipoDocumento: '01',
        numeroDocumento: numero,
        nombre: `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`,
        apellidoPaterno: data.apellidoPaterno,
        apellidoMaterno: data.apellidoMaterno,
        nombres: data.nombres,
        fuente: 'RENIEC',
      };
    } catch (error) {
      throw new HttpException(
        'No se encontró el DNI en RENIEC',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Consulta RUC → SUNAT
   */
  private async buscarRuc(numero: string) {
    try {
      const { data } = await axios.get(`${this.SUNAT_API}?numero=${numero}`, {
        headers: { Authorization: `Bearer ${this.TOKEN}` },
      });

      return {
        tipoDocumento: '06',
        numeroDocumento: numero,
        razonSocial: data.nombre,
        direccion: data.direccion,
        estado: data.estado,
        condicion: data.condicion,
        ubigeo: data.ubigeo,
        fuente: 'SUNAT',
      };
    } catch (error) {
      throw new HttpException(
        'No se encontró el RUC en SUNAT',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
