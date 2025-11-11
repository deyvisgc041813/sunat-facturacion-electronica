import { Injectable } from "@nestjs/common";
import dayjs from 'dayjs';
import { IUpdateComprobante } from "src/domain/tenant/comprobante/interface/update.interface";
import { ComprobanteRepositoryImpl } from "src/infrastructure/persistence/tenant/implement/comprobante/comprobante.repository.impl";

@Injectable()
export class UpdateComprobanteUseCase {
  constructor(private readonly comprobanteRepo: ComprobanteRepositoryImpl) {}

  async execute(comprobanteId: number, sucursalId:number, data: IUpdateComprobante, tenantDatabase?:string): Promise<{ status: boolean; message: string }> {
    data.fechaUpdate = dayjs().toDate();
    await this.comprobanteRepo.update(comprobanteId, sucursalId, data, tenantDatabase);
    return {
      status: true,
      message: `Comprobante ${comprobanteId} actualizado correctamente`,
    };
  }
}
