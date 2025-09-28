import { Injectable } from "@nestjs/common";
import dayjs from 'dayjs';import { IUpdateComprobante } from "src/domain/comprobante/interface/update.interface";
import { ComprobanteRepositoryImpl } from "src/infrastructure/persistence/comprobante/comprobante.repository.impl";

@Injectable()
export class UpdateComprobanteUseCase {
  constructor(private readonly comprobanteRepo: ComprobanteRepositoryImpl) {}

  async execute(comprobanteId: number, sucursalId:number, data: IUpdateComprobante): Promise<{ status: boolean; message: string }> {
    data.fechaUpdate = dayjs().toDate();
    await this.comprobanteRepo.update(comprobanteId, sucursalId, data);
    return {
      status: true,
      message: `Comprobante ${comprobanteId} actualizado correctamente`,
    };
  }
}
