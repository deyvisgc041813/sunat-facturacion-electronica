
import { BadRequestException, Injectable } from "@nestjs/common";
import { ComprobanteRepositoryImpl } from "src/infrastructure/persistence/comprobante/comprobante.repository.impl";

@Injectable()
export class ValidarAnulacionComprobanteUseCase {
  constructor(private readonly comprobante: ComprobanteRepositoryImpl) {}

  async execute(sucursalId:number, tipoComprobante:string, motivos: string[], estado: string, serieRef: string, correlativoRef: number): Promise<Boolean | null> {
    const comprobanteEncontrado = await this.comprobante.findComprobanteByReferencia(sucursalId, tipoComprobante, motivos, estado, serieRef, correlativoRef)
    if (comprobanteEncontrado) {
      const payload = comprobanteEncontrado?.payloadJson;
      throw new BadRequestException(
        `El comprobante ${serieRef}-${correlativoRef} ya fue anulado con la Nota de Crédito ${payload.serie}-${payload.correlativo}.`,
      );
    }
    return true
  }
}
