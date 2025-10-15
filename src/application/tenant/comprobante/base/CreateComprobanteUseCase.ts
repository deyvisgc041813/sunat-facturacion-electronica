
import { Injectable } from "@nestjs/common";
import { ICreateComprobante } from "src/domain/tenant/comprobante/interface/create.interface";
import { IResponsePs } from "src/domain/tenant/comprobante/interface/response.ps.interface";
import { ComprobanteRepositoryImpl } from "src/infrastructure/persistence/tenant/implement/comprobante/comprobante.repository.impl";

@Injectable()
export class CreateComprobanteUseCase {
  constructor( private readonly comprobanteRepo: ComprobanteRepositoryImpl) {}

  async execute(data: ICreateComprobante, payloadJson: any): Promise<{status: boolean, message: string, response?: IResponsePs }> {
  return this.comprobanteRepo.save(data, payloadJson);
  }
}
