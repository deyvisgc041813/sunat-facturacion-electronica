import { Injectable } from "@nestjs/common";
import dayjs from 'dayjs';import { IUpdateComprobante } from "src/domain/comprobante/interface/update.interface";
import { ComprobanteRepositoryImpl } from "src/infrastructure/database/repository/comprobante.repository.impl";

@Injectable()
export class UpdateComprobanteUseCase {
  constructor(private readonly comprobanteRepo: ComprobanteRepositoryImpl) {}

  async execute(comprobanteId: number, empresaId:number, data: IUpdateComprobante): Promise<{ status: boolean; message: string }> {
    data.fechaUpdate = dayjs().toDate();
    await this.comprobanteRepo.update(comprobanteId, empresaId, data);
    return {
      status: true,
      message: `Comprobante ${comprobanteId} actualizado correctamente`,
    };
  }
}
