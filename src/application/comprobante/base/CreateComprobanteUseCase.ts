import { ICreateComprobante } from "src/domain/comprobante/interface/create.interface";
import { IResponsePs } from "src/domain/comprobante/interface/response.ps.interface";
import { Injectable } from "@nestjs/common";
import { ComprobanteRepositoryImpl } from "src/infrastructure/persistence/comprobante/comprobante.repository.impl";

@Injectable()
export class CreateComprobanteUseCase {
  constructor( private readonly comprobanteRepo: ComprobanteRepositoryImpl) {}

  async execute(data: ICreateComprobante, payloadJson: any): Promise<{status: boolean, message: string, response?: IResponsePs }> {
  return this.comprobanteRepo.save(data, payloadJson);
  }
}
