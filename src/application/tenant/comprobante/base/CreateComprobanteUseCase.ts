
import { Injectable } from "@nestjs/common";
import { GenericResponse } from "src/adapter/web/response/response.interface";
import { ICreateComprobante } from "src/domain/tenant/comprobante/interface/create.interface";
import { IResponsePs } from "src/domain/tenant/comprobante/interface/response.ps.interface";
import { ComprobanteRepositoryImpl } from "src/infrastructure/persistence/tenant/implement/comprobante/comprobante.repository.impl";

@Injectable()
export class CreateComprobanteUseCase {
  constructor( private readonly comprobanteRepo: ComprobanteRepositoryImpl) {}

  async execute(data: ICreateComprobante, payloadJson: any): Promise<GenericResponse<IResponsePs>> {
  return this.comprobanteRepo.save(data, payloadJson);
  }
}
