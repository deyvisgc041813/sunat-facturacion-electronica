import { SucursalService } from 'src/domain/parent/sucursal/service/sucursal.service';
import { IResponseSunat } from 'src/domain/tenant/comprobante/interface/response.sunat.interface';
import { ComprobanteService } from 'src/domain/tenant/comprobante/services/comprobante.service';
import { ResumenService } from 'src/domain/tenant/resumen/service/resumen.service';
import { ResumenRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/resumen.impl.repository';
import { CryptoUtil } from 'src/util/CryptoUtil';
import {
  EstadoEnvioSunat,
} from 'src/util/estado.enum';
const estadosFinales = new Set([
  EstadoEnvioSunat.ACEPTADO,
  EstadoEnvioSunat.RECHAZADO,
  EstadoEnvioSunat.ERROR,
]);
export class GetStatusResumenUseCase {
  constructor(
    private readonly resumenRepo: ResumenRepositoryImpl,
    protected readonly comprobanteService: ComprobanteService,
    protected readonly sucuralService: SucursalService,
    protected readonly resumenService: ResumenService,
  ) {}

  async execute(
    empresaId: number,
    sucursalId: number,
    ticket: string,
  ): Promise<IResponseSunat> {
    const sucursal = await this.sucuralService.getDigitalCertificate(
      sucursalId,
      empresaId,
    );

    const resumen = await this.resumenService.findBySucursalAndTicket(sucursalId, ticket)
    try {
      const usuarioSecundario = sucursal?.usuarioSolSecundario ?? '';
      const claveSecundaria = CryptoUtil.decrypt(
        sucursal.claveSolSecundario ?? '',
      );
      await this.resumenService.validarEstadoFinalResumen(resumen);
    
      const result = await this.resumenService.consultarEstadoTicketSunat(
        ticket,
        usuarioSecundario,
        claveSecundaria,
      );
      await this.resumenService.updateBySucursalAndTicket(
        sucursalId,
        ticket,
        result,
      );
      // 3. Actualizar boletas
      const boletasIds: number[] = (resumen?.detalles ?? [])
        .map((d) => d.comprobante?.comprobanteId)
        .filter((id): id is number => id !== undefined);
      // esto se debe cambiar con el tocken
      await this.resumenService.updateBoletaStatus(sucursalId, boletasIds);
      return result;
    } catch (error: any) {
      // 9. Actualizar resumen con error
      const resumenId = resumen?.resumenId ?? '';
      if (resumen) {
        if (!estadosFinales.has(resumen.estado as EstadoEnvioSunat)) {
          await this.resumenRepo.update(resumenId, sucursalId, {
            estado: EstadoEnvioSunat.ERROR,
          });
        }
        await this.resumenService.procesarErrorResumen(
          error,
          resumen?.resBolId ?? 0,
          resumen?.sucursalId ?? 0,
          resumenId,
          resumen.xml ?? '',
          resumenId,
        );
      }
      throw error;
    }
  }
}
