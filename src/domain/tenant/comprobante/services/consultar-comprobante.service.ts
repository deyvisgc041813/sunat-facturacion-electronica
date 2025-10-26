import { Injectable } from '@nestjs/common';
import { EmpresaCredencialesSunatRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/empresa.credenciales.repository.impl';
import { ConsultarLoteCpeDto } from '../dto/cpe/consultar-lote.cpe.dto';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { SucursalService } from 'src/domain/parent/sucursal/service/sucursal.service';
import { EmpresaService } from 'src/domain/parent/empresa/services/empresa.service';
import { ComprobanteRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/comprobante/comprobante.repository.impl';
import { ComprobanteResponseDto } from '../dto/conprobante.response.dto';
import { ComprobanteRespuestaSunatRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/comprobante/comprobante-respuesta.sunat.repository.impl';

@Injectable()
export class ConsultarComprobanteService {
  constructor(
    protected readonly comprobanteRepository: ComprobanteRepositoryImpl,
    protected readonly comprobanteRespRepository: ComprobanteRespuestaSunatRepositoryImpl,
  ) {}
  //   constructor(
  //     private readonly http: HttpService,
  //     private readonly authService: SunatAuthService,
  //     private readonly sucursalService:SucursalService,
  //     private readonly empesaService:EmpresaService,
  //     private readonly credRepo: EmpresaCredencialesSunatRepositoryImpl,
  //   ) {}

  //   async validarCpe(data: ConsultarLoteCpeDto, auth: IUserPayload) {
  //     const cred = await this.empesaService.getById(auth.empresaId ?? 0);
  //     if (!cred) throw new Error('La empresa actual autoenticada no existe en la bd');

  //     const token = await this.authService.getAccessToken(cred.empresaId);
  //     const url = `https://api.sunat.gob.pe/v1/contribuyente/contribuyentews/cpe/${rucEmisor}/${tipoComprobante}/${serie}/${numero}/${monto}`;

  //     const res = await this.http.axiosRef.get(url, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     return res.data;
  //   }
  async getAllDocuments(sucursalId: number): Promise<ComprobanteResponseDto[]> {
    return await this.comprobanteRepository.findAllDocuments(sucursalId);
  }
  async getByIdDocument(
    sucursalId: number,
    comprobanteId: number,
  ): Promise<ComprobanteResponseDto | null> {
    const document = await this.comprobanteRepository.findByIdDocument(sucursalId, comprobanteId);
    delete document?.comprobanteRespuestaSunat 
    return document;
  }
  async getByFechaDocuments(
    sucursalId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<ComprobanteResponseDto[] | null> {
    return await this.comprobanteRepository.findBySucursalAndFecha(
      sucursalId,
      fechaInicio,
      fechaFin,
    );
  }
  async exportSignedXmlDocument(
    sucursalId: number,
    comprobanteId: number,
    pedidoId?: number,
  ) {
    if (pedidoId && pedidoId > 0) {
      const comprobante =
        await this.comprobanteRepository.findByPedidoIntegracion(
          sucursalId,
          pedidoId,
        );
      comprobanteId = comprobante?.comprobanteId ?? 0;
    }
    return await this.comprobanteRespRepository.dowloadXmlFirmado(
      sucursalId,
      comprobanteId,
    );
  }
  async exportCdrDocument(
    sucursalId: number,
    comprobanteId: number,
    pedidoId?: number,
  ) {
    if (pedidoId && pedidoId > 0) {
      const comprobante =
        await this.comprobanteRepository.findByPedidoIntegracion(
          sucursalId,
          pedidoId,
        );
      comprobanteId = comprobante?.comprobanteId ?? 0;
    }
    return await this.comprobanteRespRepository.dowloadCdrZip(
      sucursalId,
      comprobanteId,
    );
  }
}
